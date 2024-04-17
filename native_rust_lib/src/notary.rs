use std::sync::Arc;
use http_body_util::{BodyExt as _, Either, Empty, Full};
use hyper::{client::conn::http1::Parts, Request, StatusCode};
use hyper_util::rt::TokioIo;
use notary_server::{ClientType, NotarizationSessionRequest, NotarizationSessionResponse};
use rustls::{Certificate, ClientConfig, RootCertStore};
use tokio::net::TcpStream;
use tokio_rustls::TlsConnector;
use tokio_util::bytes::Bytes;
use tracing::debug;

const TLS_ROOT_CA: &str = "-----BEGIN CERTIFICATE-----
MIICzDCCAbQCCQDDGiT0U3jAszANBgkqhkiG9w0BAQsFADAoMRIwEAYDVQQKDAl0
bHNub3RhcnkxEjAQBgNVBAMMCXRsc25vdGFyeTAeFw0yMzA2MjYxMTE2MTZaFw0y
ODA2MjQxMTE2MTZaMCgxEjAQBgNVBAoMCXRsc25vdGFyeTESMBAGA1UEAwwJdGxz
bm90YXJ5MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7Vf+O9l4WNXE
Xh48MwjnvZ9wGN/Ls+jzzF1Q+J/QfXAYR/REQgJQmuk6sBgJyXUW7Dr5dKAY5tfL
rjfSaLhdMSxBH/tMepf5HVfEo6jvgk1bdR43DIZw7Z0hfuGUo6qOue8LZry2Nl+9
VZpG64quRZ///4LdMBQyXcS2yeWKU10yVNBvstKW0i8krqQfbWOIG1nu5nDg5onB
paKUvbyrLyuHLz8gzKDFezxADTugq2KRXYKIZmyRucK+kmnJnZ/k46GZ84Vju15v
ktC0CvaR9IfvLfJMAo1Y0lUR4HjQkEAfjnDFYj5B18KFxXABraVD8UxjeMbAHTjf
i1lV0yp+qQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQABxRni6FZIFeK0KCS1Nrks
ONLVPfvDSNEKpImWFFoJbaSAAankTiQM1nKTY9SRIhqG2t+xJ6c8+qe905lFFvOy
r85LMb3z2ZWs4ez6Uy6IdpSdkTULk+1huE/Y9ZqRJ5aQy7PqiHTe+mNDFmHXGdcS
azHywd4hQeRQhCBXlAG7I18uZR9DPtGaJnvZlfbpD6Iq7x3ocfGhQiV9VJS1JaQ3
Z7CJs2pa4da5FXQMAbKI2f7V5kbn3bjMp57yeYFo5wJMhEeSFqkrojR0oZDzfxW9
b0W/PI4R4d2hUvX0fwrQyXbGo8HvYDFUhlMMSF60gUNcbpF6P93tXxR2FM/hnu+T
-----END CERTIFICATE-----";


/// Requests notarization from the Notary server.
pub async fn request_notarization(
    host: &str,
    port: u16,
    max_transcript_size: Option<usize>,
) -> (tokio_rustls::client::TlsStream<TcpStream>, String) {
    
    // Connect to the Notary via TLS-TCP
    let mut reader = std::io::BufReader::new(TLS_ROOT_CA.as_bytes());
    let mut certificates: Vec<Certificate> = rustls_pemfile::certs(&mut reader)
        .unwrap()
        .into_iter()
        .map(Certificate)
        .collect();
    let certificate = certificates.remove(0);

    let mut root_store = RootCertStore::empty();
    root_store.add(&certificate).unwrap();

    let client_notary_config = ClientConfig::builder()
        .with_safe_defaults()
        .with_root_certificates(root_store)
        .with_no_client_auth();
    let notary_connector = TlsConnector::from(Arc::new(client_notary_config));

    let notary_socket = tokio::net::TcpStream::connect((host, port)).await.unwrap();

    let notary_tls_socket = notary_connector
        // Require the domain name of notary server to be the same as that in the server cert
        .connect("tlsnotaryserver.io".try_into().unwrap(), notary_socket)
        .await
        .unwrap();

    // Attach the hyper HTTP client to the notary TLS connection to send request to the /session endpoint to configure notarization and obtain session id
    let (mut request_sender, connection) =
        hyper::client::conn::http1::handshake(TokioIo::new(notary_tls_socket))
            .await
            .unwrap();

    // Spawn the HTTP task to be run concurrently
    let connection_task = tokio::spawn(connection.without_shutdown());

    // Build the HTTP request to configure notarization
    let payload = serde_json::to_string(&NotarizationSessionRequest {
        client_type: ClientType::Tcp,
        max_transcript_size,
    })
    .unwrap();

    let request = Request::builder()
        .uri(format!("https://{host}:{port}/session"))
        .method("POST")
        .header("Host", host)
        // Need to specify application/json for axum to parse it as json
        .header("Content-Type", "application/json")
        .body(Either::Left(Full::new(Bytes::from(payload))))
        .unwrap();

    debug!("Sending configuration request");

    let configuration_response = request_sender.send_request(request).await.unwrap();

    debug!("Sent configuration request");

    assert!(configuration_response.status() == StatusCode::OK);

    debug!("Response OK");

    // Pretty printing :)
    let payload = configuration_response
        .into_body()
        .collect()
        .await
        .unwrap()
        .to_bytes();
    let notarization_response =
        serde_json::from_str::<NotarizationSessionResponse>(&String::from_utf8_lossy(&payload))
            .unwrap();

    debug!("Notarization response: {:?}", notarization_response,);

    // Send notarization request via HTTP, where the underlying TCP connection will be extracted later
    let request = Request::builder()
        // Need to specify the session_id so that notary server knows the right configuration to use
        // as the configuration is set in the previous HTTP call
        .uri(format!(
            "https://{host}:{port}/notarize?sessionId={}",
            notarization_response.session_id.clone()
        ))
        .method("GET")
        .header("Host", host)
        .header("Connection", "Upgrade")
        // Need to specify this upgrade header for server to extract tcp connection later
        .header("Upgrade", "TCP")
        .body(Either::Right(Empty::<Bytes>::new()))
        .unwrap();

    debug!("Sending notarization request");

    let response = request_sender.send_request(request).await.unwrap();

    debug!("Sent notarization request");

    assert!(response.status() == StatusCode::SWITCHING_PROTOCOLS);

    debug!("Switched protocol OK");

    // Claim back the TLS socket after HTTP exchange is done
    let Parts {
        io: notary_tls_socket,
        ..
    } = connection_task.await.unwrap().unwrap();

    (
        notary_tls_socket.into_inner(),
        notarization_response.session_id,
    )
}
