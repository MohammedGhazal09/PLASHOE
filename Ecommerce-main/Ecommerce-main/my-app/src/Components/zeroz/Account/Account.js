import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGoogle, faFacebookF, faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons"
// import siteLogo from '../../Imgs/zeroz/site-logo.png'
import AccountStyle from './AccountStyle.css'

export default function Account() {
    const [active, setActive] = useState('login');
    const [mobile, setMobile] = useState(()=> window.innerWidth < 600 ? true : false);
    useEffect(() => {
        const handleResize = () => {
            setMobile(window.innerWidth < 600);
        };

        // Set the initial state and add resize listener
        window.addEventListener('resize', handleResize);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    console.log(active);
    return (
        <>
            <div className="mainAccountContainer flex h-[100vh] w-[100vw] shadow-xl bg-[white] justify-center items-center">
            {mobile ? 
            <div className="changeBtn h-[70%] w-[70vw] flex justify-end">
                <button onClick={()=> active == 'login' ? setActive('signup') : setActive('login')} className="z-20 absolute m-[2%] bg-[#6e7051] tracking-widest font-semibold text-[0.8rem] text-white p-2 duration-[0.8s] hover:bg-[#262b2c] rounded">{active.charAt(0).toUpperCase() + active.slice(1)}</button>
                <a href="/"><h1 className="websiteLogo w-[100%] mt-[-25%] text-5xl text-center font-semibold tracking-widest text-white">PLASHOE</h1></a>
            </div>
             : null}   
                <div className={`logReg ${mobile && active == 'login' ? 'z-11' : 'z-10'} p-[2%] h-[60%] flex flex-col justify-center min-h-fit w-[25vw] rounded-s-2xl bg-white`}>
                    <h2 className="text-4xl font-bold text-center mb-[5%]">Sign in</h2>
                    <div className="flex justify-center gap-x-[2%]">
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faGoogle} />
                        </div>
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faFacebookF} /> 
                        </div>
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faLinkedinIn} />
                        </div>
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faXTwitter} /> 
                        </div>
                    </div>
                    <p className="text-center mt-[5%] mb-[3%] font-semibold">Login with Email & Password</p>
                        <input  className="w-[100%] bg-[#eee] mb-[5%] p-[2%] ps-[3%] rounded" type="email" placeholder="Email" />
                        <input  className="w-[100%] bg-[#eee] mb-[5%] p-[2%] ps-[3%] rounded" type="password" placeholder="Password" />
                        <a href="/" className="flex justify-center">
                            <button className="py-[2%] px-[10%] bg-[#6e7051] tracking-widest font-semibold text-[1rem] mt-[2%] text-white p-3 duration-[0.8s] hover:bg-[#262b2c] rounded">Login</button>
                        </a>
                </div>

                <div className={`logReg ${mobile && active == 'signup' ? 'z-11' : 'z-10'} p-[2%] h-[60%] flex flex-col justify-center min-h-fit w-[25vw] rounded-e-2xl bg-white`}>
                    <h2 className="text-4xl font-bold text-center mb-[5%]">Create Account</h2>
                    <div className="flex justify-center gap-x-[2%]">
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faGoogle} />
                        </div>
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faFacebookF} /> 
                        </div>
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faLinkedinIn} />
                        </div>
                        <div className="p-[2%] aspect-square border rounded px-[3%] shadow-md cursor-pointer duration-[0.5s] hover:bg-slate-50">
                            <FontAwesomeIcon icon={faXTwitter} /> 
                        </div>
                    </div>
                    <p className="text-center mt-[5%] mb-[3%] font-semibold">Register with E.mail</p>
                        <input required className="w-[100%] bg-[#eee] mb-[5%] p-[2%] ps-[3%] rounded" type="text" placeholder="Name" />
                        <input required className="w-[100%] bg-[#eee] mb-[5%] p-[2%] ps-[3%] rounded" type="email" placeholder="Email" />
                        <input required className="w-[100%] bg-[#eee] mb-[5%] p-[2%] ps-[3%] rounded" type="password" placeholder="Password" />
                        <a href="/" className="flex justify-center">
                            <button className="py-[2%] px-[10%] bg-[#6e7051] tracking-widest font-semibold text-[1rem] mt-[2%] text-white p-3 duration-[0.8s] hover:bg-[#262b2c] rounded">SIGN UP</button>
                        </a>
                </div>
            
            {!mobile ? 
                <div className="absolute flex h-[100vh] w-[100vw] bg-[#262b2c] justify-center items-center">
                    <div className={`logRegTitle p-[2%] h-[60%] flex flex-col justify-center items-center min-h-fit w-[25vw] rounded-2xl duration-[1s] bg-[#6e7051]${
                        active === 'signup' ? ' signupActive' : ''}`}> 
                        <div className="flex justify-center">
                            <h1 className="websiteLogo text-6xl font-semibold tracking-widest text-white">PLASHOE</h1>
                        </div>
                        <p className="text-center text-sm p-[5%] text-gray-300 font-bold tracking-wide">Create an account to unlock exclusive benefits and personalized recommendations.</p>
                        <button id="signup" onClick={() => setActive('login')} className="py-[2%] px-[10%] border text-white tracking-widest font-semibold text-[1rem] mt-[2%] border-white p-3 rounded hover:text-black hover:bg-white duration-[0.8s]">SIGN UP</button>
                    </div>
                    <div className={`logRegTitle p-[2%] h-[60%] flex flex-col justify-center items-center min-h-fit w-[25vw] rounded-2xl duration-[1s] bg-[#6e7051]
                        ${active === 'login' ? ' loginActive' : ''}`}> 
                        <div className="flex justify-center">
                            <h1 className="websiteLogo text-6xl font-semibold tracking-widest text-white">PLASHOE</h1>
                        </div>
                        <p className="text-center text-sm p-[5%] text-gray-300 font-bold tracking-wide">Access your account and manage your orders effortlessly.</p>
                        <button id="login" onClick={() => setActive('signup')} className="py-[2%] px-[10%] border text-white tracking-widest font-semibold text-[1rem] mt-[2%] border-white p-3 rounded hover:text-black hover:bg-white duration-[0.8s]">LOGIN</button>
                    </div>
                </div>
                : null}
            </div>
        </>
    )
}