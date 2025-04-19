import CheckoutStyle from './CheckoutStyle.css'
import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import siteLogo from '../../Imgs/zeroz/site-logo.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDolly, faLock, faAngleUp, faSortAmountAsc } from '@fortawesome/free-solid-svg-icons';
export default function Checkout() {
    const [country, setCountry] = useState([]);
    const [summary, setSummary] = useState(false);
    async function fetchCounties() {
        try {
            const response = await fetch('https://countriesnow.space/api/v0.1/countries');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const json = await response.json();
            setCountry(json.data.map(item => item.country));
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
    fetchCounties();
    useEffect(() => {
        if(window.innerWidth >= 1200){
            document.getElementById('yourOrderDiv').style.display = 'block';
        }else if (!summary) {
            document.getElementById("yourOrderDiv").style.display = "none";
        }
    })
    function changeSummary(){
        setSummary((prevSummary) => {
            const newSummary = !prevSummary;
            const dropdownArrow = document.getElementById('dropdownArrow');
            const yourOrderDiv = document.getElementById('yourOrderDiv');
    
            if (dropdownArrow) {
                dropdownArrow.style.transform = newSummary ? "rotate(180deg)" : "rotate(0deg)";
            }
    
            if (yourOrderDiv) {
                yourOrderDiv.style.display = newSummary ? "block" : "none";
            }
    
            return newSummary;
        });
    }
    const data = JSON.parse(window.localStorage.getItem("item"));
    const discount = JSON.parse(window.localStorage.getItem("discount"));
    return(
        <>
            <a href="/" className='flex justify-center py-[1%] cursor-pointer'>
                <img src={siteLogo}/>
            </a>
            <div id='checkoutMainPageContainer'  className='bg-[#f1f1ef] flex justify-center items-center h-[fit-content] px-[15%] py-[2%] min-w-fit'>
                <div className='bg-white w-[100%] h-[100%] my-[3%] px-[5%]'>
                    <h1 className='text-7xl font-semibold text-center py-[5%]'>Checkout</h1>
                    <div id='cheackoutContainer' className='flex gap-x-[5%]  max-h-fit'>
                        <form id='checkoutForm' className='w-[55%]'>
                            <h3 className='border-b w-fit border-[#ddd] py-[2%] text-2xl font-bold'>Customer information</h3>
                            <div className='mt-[3%]'>
                                <input required type='text' placeholder='Username or Email Address *' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                            </div>
                            <h3 className='border-b border-[#ddd] py-[2%] text-2xl font-bold'>Billing details</h3>
                            <div className='mt-[3%]'>
                                <div className='flex gap-x-[3%]'>
                                    <input required placeholder='First name *' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                    <input required placeholder='Last name *' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                </div>
                                <input placeholder='Company name' className='border mt-[3%] p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                <Autocomplete
                                    required
                                    className='mt-[3%]'
                                    disablePortal
                                    options={country}
                                    renderInput={(params) => <TextField {...params} label="Country/Region *" />}
                                    />                   
                                <div className='flex gap-x-[3%] mt-[3%]'>
                                    <input placeholder='House number and street name' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                    <input placeholder='Apartment, suite, unit, etc.' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                </div>         
                                <div className='flex gap-x-[3%] mt-[3%]'>
                                    <input required placeholder='Town / City *' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                    <input required placeholder='State *' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                    <input required placeholder='ZIP Code *' className='border p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                                </div>         
                                    <input required placeholder='Phone *' className='border mt-[3%] p-[1.5%] rounded text-lg text-black w-full border-[#ddd]'/>
                            </div>
                            <h3 className='border-b border-[#ddd] py-[2%] text-2xl font-bold'>Additional information</h3>
                            <textarea className='border mt-[3%] p-[1.5%] rounded text-lg text-black w-full border-[#ddd]' placeholder='Notes about your order, e.g. spectial notes for delivery.'/>
                            <h3 className='py-[2%] text-2xl font-bold'>payments</h3>
                            <div className='mt-[1%] mb-[10%]'>
                                <div className='flex p-[3%] gap-x-[2%] border-t-4 border-[#6e7051] bg-[#f7f6f7] '>
                                    <FontAwesomeIcon className='text-2xl mt-1.5 text-[#6e7051]' icon={faDolly} />
                                    <p className='text-md font-semibold text-[#6e7051]'>Sorry, it seems that there are no available payment methods.
                                    Please contact us if you require assistance or wish to make alternate arrangements.
                                    </p>
                                </div>
                                <a href='/' className='flex justify-center items-center gap-x-[2%]'>
                                    <button className=' bg-[#6e7051] tracking-widest font-semibold text-[1rem] mt-[2%] text-white p-3 w-[100%] duration-[0.8s] hover:bg-[#262b2c]'>
                                    <FontAwesomeIcon className='text-sm' icon={faLock} />
                                    <p>PLACE ORDER ${discount ? ((1-(discount / 100)) * data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') ,0 )).toFixed(2) : data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') ,0).toFixed(2)}</p>
                                    </button>
                                </a>
                            </div>
                        </form>
                        <div id='yourOrder' className='w-[45%] max-h-fit rounded'>
                            <h3 className='w-fit py-[2%] text-2xl font-bold'>Your order</h3>
                            <div id='yourOrderContainer' className='text-[#979a9b] font-semibold border mt-[1%] rounded text-lg w-full border-[#ddd]'>
                                <div onClick={changeSummary} id='yourOrderSummary' className='hidden items-center border-b border-[#e5e7eb] ps-[4%] cursor-pointer justify-between bg-[#f1f1ef]'>
                                    <div className='flex py-[5%] w-[75%] items-center gap-x-[2%]'>
                                        <h6 className='whitespace-nowrap'>Show Order Summary</h6>
                                        <FontAwesomeIcon id='dropdownArrow' className='duration-[0.4s] mt-1' icon={faAngleUp} />
                                    </div>
                                    <p className='yourOrderValue w-[25%] py-[3%] font-bold text-center min-w-fit'>${discount ? ((1-(discount / 100)) * data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') ,0 )).toFixed(2) : data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') ,0).toFixed(2)}</p>
                                </div>
                                <div id='yourOrderDiv'>
                                    <div id='yourOrderTitle' className='flex ps-[2%] py-[3%] justify-between items-center border-b'>
                                        <p className='w-[75%] min-w-fit'>Product</p>
                                        <p className='yourOrderValue w-[25%] min-w-fit text-center'>Subtotal</p>
                                        </div>
                                    <div>
                                        {data.map(item =>
                                            <div className='flex ps-[4%] justify-between items-center border-b'>
                                                <div className='flex py-[3%] w-[75%] items-center gap-x-[2%]'>
                                                    <img src={`${process.env.PUBLIC_URL}${item.img}`} className='w-[75px] rounded h-[75px]'/>
                                                    <p className='text-[1rem]'>{item.name} x {item.shoesNumber}</p>
                                                </div>
                                                <p className='yourOrderValue w-[25%] text-center'>${item.price.new.toString().replace("$",'')}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex ps-[4%] py-[3%] justify-between items-center border-b'>
                                        <h6 className=' w-[75%] min-w-fit'>Subtotal</h6>
                                        <p className='yourOrderValue w-[25%] text-center min-w-fit'>${data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') * item.shoesNumber ,0 ).toFixed(2)}</p>
                                    </div>
                                    <div className='flex ps-[4%] py-[3%] justify-between items-center border-b'>
                                        <h6 className=' w-[75%] font-bold min-w-fit'>Total</h6>
                                        <p className='yourOrderValue w-[25%] font-bold text-center min-w-fit'>${discount ? ((1-(discount / 100)) * data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') ,0 )).toFixed(2) : data.reduce((acc,item) => acc + +item.price.new.toString().replace('$','') ,0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}