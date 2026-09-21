#!/usr/bin/env bash
# Ferhat Academy — İlk sunucu kurulumu
# Çalıştır: bash deploy/server-setup.sh
# Sunucuda /opt/ferhatacademy/ dizinini hazırlar.

set -euo pipefail

DEPLOY_DIR="/opt/ferhatacademy"

echo "📁 Dizin oluşturuluyor: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"/{backups,scripts}
chmod 750 "$DEPLOY_DIR"

echo "📋 .env şablonu oluşturuluyor (doldurmayı unutma!)"
cat > "$DEPLOY_DIR/.env" <<'ENV'
DATABASE_URL=postgresql://ferhat:GUCLU_SIFRE@ferhatacademy-postgres:5432/ferhatacademy
POSTGRES_USER=ferhat
POSTGRES_PASSWORD=GUCLU_SIFRE
POSTGRES_DB=ferhatacademy

BETTER_AUTH_SECRET=BURAYA_GUCLU_SECRET_YAZ
BETTER_AUTH_URL=https://ferhatacademy.com

NEXT_PUBLIC_APP_URL=https://ferhatacademy.com
NODE_ENV=production

RESEND_API_KEY=re_xxxx
EMAIL_FROM=Ferhat Academy <noreply@ferhatacademy.com>
ADMIN_NOTIFY_EMAIL=info@ferhatacademy.com
ENV
chmod 600 "$DEPLOY_DIR/.env"

echo "⚠️  $DEPLOY_DIR/.env dosyasını düzenle ve gerçek şifreleri gir!"
echo ""
echo "Sonraki adımlar:"
echo "  1. nano $DEPLOY_DIR/.env   ← şifreleri gir"
echo "  2. docker-compose.prod.yml dosyasını $DEPLOY_DIR/docker-compose.yml olarak kopyala"
echo "  3. cd $DEPLOY_DIR && docker-compose pull"
echo "  4. docker-compose run --rm web npx prisma migrate deploy"
echo "  5. docker-compose up -d"
echo "  6. curl http://localhost:3010/api/health"
