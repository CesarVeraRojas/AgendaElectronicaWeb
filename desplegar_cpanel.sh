#!/bin/bash
# desplegar_cpanel.sh — copia la web a la carpeta del subdominio en cPanel.
#
# Lo ejecuta cPanel (Git Version Control → "Desplegar HEAD") a través de
# .cpanel.yml, desde la carpeta del repositorio clonado en el servidor:
#
#     bash desplegar_cpanel.sh /home/USUARIO/carpeta_del_subdominio
#
# Copia SÓLO lo que la web necesita: nada de tests/, README.md, render.yaml,
# .git ni este script. No borra nada del destino: .well-known/ (certificado),
# cgi-bin/ y .user.ini son de cPanel y se quedan como están.
#
# El .htaccess del destino puede tener un bloque que escribe cPanel
# ("BEGIN cPanel-generated php ini directives"). Se conserva ese bloque y
# debajo van las reglas del .htaccess de este repositorio.
set -euo pipefail

DESTINO="${1:?Falta la carpeta destino}"
DESTINO="${DESTINO%/}"
ORIGEN="$(cd "$(dirname "$0")" && pwd)"

[ -d "$DESTINO" ] || { echo "No existe la carpeta destino: $DESTINO" >&2; exit 1; }
[ -f "$ORIGEN/index.html" ] || { echo "No encuentro index.html en $ORIGEN" >&2; exit 1; }

cp -f  "$ORIGEN/index.html" "$ORIGEN/prueba-video.html" "$DESTINO/"
cp -Rf "$ORIGEN/assets" "$ORIGEN/src" "$ORIGEN/vendor" "$DESTINO/"

BLOQUE_CPANEL=""
if [ -f "$DESTINO/.htaccess" ]; then
    BLOQUE_CPANEL="$(sed -n '/# BEGIN cPanel-generated/,/# END cPanel-generated/p' "$DESTINO/.htaccess")"
fi
{
    if [ -n "$BLOQUE_CPANEL" ]; then printf '%s\n\n' "$BLOQUE_CPANEL"; fi
    cat "$ORIGEN/.htaccess"
} > "$DESTINO/.htaccess.nuevo"
mv -f "$DESTINO/.htaccess.nuevo" "$DESTINO/.htaccess"

echo "Web desplegada en $DESTINO ($(date '+%Y-%m-%d %H:%M'))"
