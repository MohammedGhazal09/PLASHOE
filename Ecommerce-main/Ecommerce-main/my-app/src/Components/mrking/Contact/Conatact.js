import React , { useState } from "react";
import './Contact.css'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Accordion from "./ContactAcordion"
export default function Contact() {
    document.body.className = "contBody";
    return (
        <div className="bigDiv mx-[5%]">
            <h1 id="dDD" className="text-center mx-auto my-16 text-7xl font-semibold">Contact</h1>
            <div className="contactDiv flex flex-row w-full flex-wrap justify-evenly items-center bg-[#f1f1ef] ">
                <div className="infoContainer my-15 p-10 ">
                    <h3 className="text-[#262b2c]  text-2xl font-semibold"><PhoneIphoneIcon/> Products & order</h3>
                    <p className="text-[#979a9b] text-lg pl-[8%] indent-[15px] text-nowrap ">(+1) 123-456-7890</p>
                    <p className=" mb-5 text-[#979a9b] text-lg pl-[8%] indent-[16px] text-wrap">available 24/7</p>
                    <div className="mb-5 w-[300px] h-[1px] bg-[#e4e6e7] relative"/>
                    <h3 className="mt-5 text-[#262b2c]  text-2xl font-semibold"><PhoneIphoneIcon/> Products & order</h3>
                    <p className="text-[#979a9b] text-lg pl-[8%] indent-[15px] text-nowrap ">(+1) 123-456-7890</p>
                    <p className="mb-5 text-[#979a9b] text-lg pl-[8%] indent-[16px] text-wrap">available 24/7</p>
                    <div className="mt-2 w-[300px] h-[1px] bg-[#e4e6e7] relative"/>
                    <h3 className="mt-5 text-[#262b2c]  text-2xl font-semibold"><LocationOnIcon/> Store Locator</h3>
                    <p className="text-[#979a9b] text-lg pl-[8%] indent-[15px] p-2 text-nowrap ">Find our retail near you</p>
                    <div className="my-4 w-[300px] h-[1px] bg-[#e4e6e7] relative"/>
                    <h4 className="text-[#262b2c] tracking-widest font-semibold">Stay in touch</h4>
                    <ul className="flex flex-row gap-6 mt-3">
                        <li className="cursor-pointer"><FacebookIcon/></li>
                        <li className="cursor-pointer"><XIcon/></li>
                        <li className="cursor-pointer"><YouTubeIcon/></li>
                    </ul>
                </div>
                <span className=" w-[1px] h-[500px] bg-[#e4e6e7] relative"></span>
                <div className="formContainer my-20 flex flex-col justify-center items-center grow-[0.3]">
                    <form className="w-full flex flex-col justify-center items-start" action={(e) => e.preventDefault()}>
                        <label htmlFor="name">
                            <p>Name<span className="text-red-600">*</span></p>
                        </label>
                        <input required id="name" className="w-full mb-5 border border-[#e4e6e7]  h-[50px] rounded-md"></input>
                        <label htmlFor="email">
                            <p>Email<span className="text-red-600">*</span></p>
                        </label>
                        <input required id="email" type="email" className="w-full mb-5 border border-[#e4e6e7]  h-[50px] rounded-md"></input>
                        <label htmlFor="message">
                            <p>Message<span className="text-red-600">*</span></p>
                        </label>
                        <textarea required id="message"  className="w-full border border-[#e4e6e7]  h-[200px] rounded-md"></textarea>
                        <button className="text-[#f1f1ef] font-bold tracking-widest text-lg px-10 py-5 mt-10 rounded-sm bg-[#262b2c]" type="submit">Send Message</button>
                    </form>
                </div>
            </div>
            <div className="text-center mx-auto my-20 flex flex-col justify-center items-center">
                <h1 className="text-[#262b2c] tracking-wide text-4xl font-semibold mb-4">Frequently Asked Questions</h1>
                <p className="text-[#979a9b]">Purus amet scelerisque nisl nibh felis massa a enim gravida</p>
                <div className="m-20 min-w-[300px] max-w-[1000px]">
                <Accordion/>
                </div>
            </div>
        </div>
    )
}