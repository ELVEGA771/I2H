# DeUna Negocio Expo

Demo nativa Expo para que el negocio cree campañas Rewards, vea insights y escanee QR de canje.

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

1. Abrir `Rewards`.
2. Editar nombre, regla, meta, reward, condiciones y estado.
3. Guardar la campaña.
4. Abrir `Escanear` y validar el QR generado por la app cliente.
