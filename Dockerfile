FROM rust:1.92 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/anillo .
COPY static ./static
EXPOSE 8080
CMD ["./anillo"]
