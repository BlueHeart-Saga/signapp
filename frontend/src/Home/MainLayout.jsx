import React from "react";
import { Outlet } from "react-router-dom";

import FeedbackWidget from "../components/FeedbackWidget";
import Footer from "./Footer";
import MainNavbar from "./MainNavbar";


const MainLayout = () => {
  return (
    <div className="main-layout" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      
      {/* Navigation bar */}
     <MainNavbar />

      {/* Main content area */}
      <main style={{ flex: 1 , marginTop: '60px' }}>
        <Outlet /> {/* Nested routes render here */}
      </main>

      {/* Footer */}
      <Footer />
      
      <FeedbackWidget />
    </div>
  );
};

export default MainLayout;
