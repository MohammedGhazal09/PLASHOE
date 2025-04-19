import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
// import 'flowbite';
import reportWebVitals from './reportWebVitals';
import Header from './Components/zeroz/Header/Header';
import Footer from './Components/zeroz/Footer/Footer';
import HomeContent from './Components/zeroz/Home/homeContent';
import LookBook from './Components/zeroz/LookBook/LookBook'
import Cart from './Components/zeroz/Cart/Cart'
import Checkout from './Components/zeroz/Checkout/Checkout'
import Account from './Components/zeroz/Account/Account'
import OurStory from './Components/zeroz/OurStory/OurStory';
import Men from "./Components/mrking/Men/menPage";
import Women from "./Components/mrking/Women/womenPage";
import Collection from "./Components/mrking/Collection/menNWomen";
import Sale from "./Components/mrking/Sale/Sale";
import Contact from "./Components/mrking/Contact/Conatact";

const router = createBrowserRouter([
  { path: '/',
  element: 
    <App/>
  },
  {path: '/men',
    element: 
    <>
      <Header/>
      <Men/>
      <Footer/>
    </>
  },
  {path: '/women',
    element: 
    <>
      <Header/>
      <Women/>
      <Footer/>
    </>}
  ,
  {path: '/collection',
    element: 
    <>
      <Header/>
      <Collection/>
      <Footer/>
    </>
  },
  {path: '/sale',
    element: 
    <>
      <Header/>
      <Sale/>
      <Footer/>
    </>
  },
  {path: '/contact',
    element:
    <>
      <Header/>
      <Contact/>
      <Footer/>
    </>
  },
  { path: '/lookbook',
    element: 
    <>
      <Header/>
      <LookBook />
      <Footer/>
    </>
  },
  { path: '/ourstory', 
    element: 
    <>
      <Header/>
      <OurStory/>
      <Footer/>
    </>
  },
  { path: '/cart',
     element:
     <>
      <Header/>
      <Cart />
      <Footer/>
     </> 
  },
  { path: '/checkout', 
    element:
      <Checkout /> 
  },
  { path: '/account', 
    element: 
      <Account /> 
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
    {/* <App/> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

