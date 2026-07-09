import { createApp } from './app';

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

const app = createApp({ jwtSecret });

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`PMS backend listening on port ${port}`);
});
