# Deuna Rewards

Demo de rewards para negocios y clientes.

## Estructura

- `back`: API Express/Postgres para comercios, campañas, puntos, rewards y canje por QR.
- `app-cliente-expo`: app Expo del cliente.
- `app-negocio-expo`: app Expo del negocio.
- `pitch`: presentación HTML.

Los frontends Svelte anteriores fueron retirados.

## Docker Compose

Docker Compose sirve las apps Expo como web builds estáticos:

```bash
docker compose up --build
```

Puertos:

- API: `http://localhost:3000`
- Cliente Expo web: `http://localhost:5173`
- Negocio Expo web: `http://localhost:5174`

Para probar desde un teléfono en la misma Wi-Fi, construye pasando la IP LAN del computador:

```bash
$env:EXPO_PUBLIC_API_URL="http://TU_IP_LAN:3000"
docker compose up --build
```

Expo Go nativo no corre dentro del compose; para eso usa `npx expo start --clear --host lan` dentro de cada app Expo.
