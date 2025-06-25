#!/bin/sh
set -e

# Criar o arquivo de configuração do ambiente com as variáveis atuais
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV_CONFIG = {
  VITE_WEBSOCKET_URL: "${VITE_WEBSOCKET_URL}",
  VITE_API_URL: "${VITE_API_URL}"
};
console.log("Runtime environment loaded:", window.ENV_CONFIG);
EOF

echo "Ambiente de execução configurado com:"
echo "VITE_WEBSOCKET_URL: ${VITE_WEBSOCKET_URL}"
echo "VITE_API_URL: ${VITE_API_URL}"

# Iniciar o Nginx usando o processo padrão da imagem oficial
exec nginx -g 'daemon off;' 