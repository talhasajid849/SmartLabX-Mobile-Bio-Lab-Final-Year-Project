export const metadata = {
  title: {
    default: 'Mobile Bio Lab - Mobile Bio Lab on Wheels',
    template: '%s | Mobile Bio Lab'
  },
  description: 'Access cutting-edge biological research facilities remotely. Perfect for students, researchers, and technicians in remote or virtual learning environments.',
  keywords: ['biology lab', 'mobile laboratory', 'research', 'science', 'biological samples', 'data analysis', 'remote learning'],
  authors: [{ name: 'Mobile Bio Lab Team' }],
  creator: 'Mobile Bio Lab',
  publisher: 'Mobile Bio Lab',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Mobile Bio Lab - Mobile Bio Lab on Wheels',
    description: 'Access cutting-edge biological research facilities remotely.',
    url: 'http://localhost:3000',
    siteName: 'Mobile Bio Lab',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobile Bio Lab - Mobile Bio Lab on Wheels',
    description: 'Access cutting-edge biological research facilities remotely.',
    creator: '@smartlabx',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};