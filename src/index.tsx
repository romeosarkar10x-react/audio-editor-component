import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElem = document.createElement("div");
rootElem.id = "react";

document.body.appendChild(rootElem);

createRoot(rootElem).render(<App />);
