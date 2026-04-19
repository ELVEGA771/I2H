# DeUna Cliente Expo

Demo nativa Expo para el flujo de cliente de Deuna Rewards.

## Configuración LAN

El teléfono no puede usar `localhost` para llegar al backend del PC. Crea un archivo `.env` copiando `.env.example` y cambia la IP por la IP LAN de tu computador:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

El backend debe estar corriendo en `I2H/back` y el teléfono debe estar en la misma red Wi-Fi.

## Ejecutar

```bash
npm install
npx expo start --clear --host lan
```

Flujo de demo:

1. Abrir `Beneficios`.
2. Entrar a un comercio con Rewards.
3. Simular una compra hasta desbloquear el premio.
4. Mostrar el QR al negocio para que lo escanee desde la app de empresa.
