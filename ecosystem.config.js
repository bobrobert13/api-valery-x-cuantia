module.exports = {
  apps : [{
    name: "api-valery-cuantia-local",
    script: "./build/app.js",
    // Equivalente a: -r dotenv/config
    node_args: "-r dotenv/config",

    max_memory_restart: "300M", 
    // REINICIO SI EL PROCESO ESTÁ INESTABLE
    min_uptime: "60s",
    max_restarts: 10,
    // LOGS PARA DEPURAR SI SE PEGA
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    // AUTO-RESTART
    autorestart: true,
    watch: false, // No usar en producción, solo desarrollo
    env: {
        NODE_ENV: "production",
    }
  }]
}