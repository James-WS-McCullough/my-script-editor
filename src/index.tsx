import * as React from "react";
import ReactDOM from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import { BrowserRouter, HashRouter, Route, Routes, useParams } from "react-router-dom";

// Check if we're running in Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

const LoadScript = () => {
  const { uuid } = useParams();

  if (!uuid) return <div>Invalid script</div>;

  return <App isReadOnly={true} scriptId={uuid} />;
};

// Use HashRouter for Electron (file:// protocol), BrowserRouter for web
const Router = isElectron() ? HashRouter : BrowserRouter;

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <ChakraProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/loadscript/:uuid" element={<LoadScript />} />
        </Routes>
      </ChakraProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
