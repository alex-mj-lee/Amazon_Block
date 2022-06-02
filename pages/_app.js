import "../styles/globals.css";
import { MoralisProvider } from "react-moralis";
import { GalleryProvider } from "../context/GalleryContext";
import { ModalProvider } from "react-simple-hook-modal";

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider
      serverUrl={process.env.NEXT_PUBLIC_MORALIS_SERVER}
      appId={process.env.NEXT_PUBLIC_MORALIS_APP_ID}
    >
      <GalleryProvider>
        <ModalProvider>
          <Component {...pageProps} />
        </ModalProvider>
      </GalleryProvider>
    </MoralisProvider>
  );
}

export default MyApp;
