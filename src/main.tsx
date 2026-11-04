import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { Agents, Manifesto } from "./sections/HowItWorks";
import { Story } from "./sections/Story";
import { Capabilities } from "./sections/Capabilities";
import { Trust } from "./sections/Trust";
import { Compare, Footer, Join } from "./sections/Rest";
import { Avatar } from "./components/Avatar";

function App() {
  return (
    <div className="grain">
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <div className="dark mx-2 rounded-[28px] bg-canvas sm:mx-4 sm:rounded-[40px]">
          <Story />
        </div>
        <Agents />
        <Capabilities />
        <Trust />
        <Compare />
      </main>
      <div className="dark mx-2 mb-2 overflow-hidden rounded-[28px] bg-canvas sm:mx-4 sm:mb-4 sm:rounded-[40px]">
        <Join />
        <Footer />
      </div>
      <Avatar />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
