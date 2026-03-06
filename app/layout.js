import './globals.css';

export const metadata = {
  title: 'Champions League Predictions 2025/26',
  description: 'Prediction tournament for the Champions League 2025/26 season',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
