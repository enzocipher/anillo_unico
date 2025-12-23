use actix_files::{NamedFile, Files};
use actix_web::{web, App, HttpRequest, HttpServer, Result};

async fn index(_req: HttpRequest) -> Result<NamedFile> {
    Ok(NamedFile::open("./static/index.html")?)
}

async fn generar(_req: HttpRequest) -> Result<NamedFile> {
    Ok(NamedFile::open("./static/generar.html")?)
}

async fn anillo(_req: HttpRequest) -> Result<NamedFile> {
    Ok(NamedFile::open("./static/anillo.html")?)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Iniciando servidor en http://0.0.0.0:8080");

    HttpServer::new(|| {
        App::new()
            .service(Files::new("/static", "./static").show_files_listing().use_last_modified(true))
            .route("/", web::get().to(index))
            .route("/generar", web::get().to(generar))
            .route("/anillo", web::get().to(anillo))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
