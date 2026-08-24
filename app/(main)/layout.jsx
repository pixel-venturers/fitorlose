import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Footer as FooterComponent } from "components";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FooterComponent />
    </>
  );
}
