import React, { useEffect, useState } from "react";
import SalesButton from './SalesButton'
import "./Sale.css";
import Rating from '@mui/material/Rating';
import { faX } from '@fortawesome/free-solid-svg-icons'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faPinterestP, faXTwitter , faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'


export default function Sale() {
    document.body.className = "saleBody";
    const [female, setFemale] = useState([]);
    const [male, setMale] = useState([]);
    
    async function test(){
        try{
            const response = await fetch(`${window.location.toString().slice(0,-4)}database/database.json`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const json = await response.json();
            setFemale(json.female);
            setMale(json.male);
        }catch(error){
            console.error(error.message);
        }
    }
    useEffect(()=>{
        test();
    }, [])

    let saleShoes = female.concat(male).filter((item) => item.price.old > item.price.new);
    const [highQuickView, setHighQuickView] = useState(false);
    const [latestQuickView, setLatestQuickView] = useState(false);
    const [shoesSize, setShoesSize] = useState("")
    const [highQuickVal, setHighQuickVal] = useState('');
    const highQuickViewChange = (e) => {
        setHighQuickView(!highQuickView);
        setShoesNum(1);
        setShoesSize(35);
        if(document.querySelector('body').style.overflow == 'hidden'){
            document.querySelector('body').style.overflow = 'visible';
        }else{
            document.querySelector('body').style.overflow = 'hidden';
        }
        // console.log(e.target.value)
        if(e.target.textContent != ''){
            setHighQuickVal(saleShoes.filter(item => item.name == e.target.textContent )|| "");
            
        }else{
            setHighQuickVal(saleShoes.filter(item => (`${window.location.toString().slice(0,-4)}${item.img.substr(1)}`).toString() == e.target.src) || "");
        }
            setShoesNum(1);
    }

    function sizeChanging(){        
        let getSize = document.querySelector('.size');
        setShoesSize(getSize.value || 35);
    }

    let [shoesNum, setShoesNum] = useState(1)
    function addShoes(){
        setShoesNum(++shoesNum);
    }
    function removeShoes(){
        if(shoesNum > 1)
        setShoesNum(--shoesNum);
    }
    function addToCart(e) {
        const itemName = e.target.parentNode.parentNode.firstChild.innerHTML;
        const itemToAdd = {
            ...female.concat(male).find(item => item.name === itemName),
            shoesNumber: shoesNum,
            shoesSize: shoesSize
            
        };
        if(latestQuickView){
            setLatestQuickView(!latestQuickView);
        }else if(highQuickView){
            setHighQuickView(!highQuickView);
        }
        document.querySelector('body').style.overflow = 'visible';
        // Retrieve current items from local storage
        const currentItems = JSON.parse(localStorage.getItem("item")) || [];
        // Add the new item to the list
        const updatedItems = [...currentItems, itemToAdd];
        // Save updated list back to local storage
        localStorage.setItem("item", JSON.stringify(updatedItems));

        // Trigger storage event to sync other components
        window.dispatchEvent(new Event('storage'));
        setShoesNum(1);
    }
    
    document.body.style.backgroundColor = "#f1f1ef";
    return (
        <div className="flex flex-col justify-center items-center m-[3%] bg-white">
            <h1 className="p-[3%] font-bold font-sans text-7xl">Sale</h1>
            <div className="flex flex-wrap gap-4 justify-center my-5">
                <div className="relative h-[360px] sm:w-[48%] lg:w-[45%] bg-cover bg-center"
                     style={{ backgroundImage: "url(/database/salesImgs/SalesImg1.jpg)" }}>
                    <div className="flex justify-evenly flex-col items-center absolute inset-0 bg-black bg-opacity-50">
                        <h1 className="salesTxt text-2xl font-semibold text-white">Promotion</h1>
                        <h1 className="salesTxt text-4xl font-semibold text-white">Student Discount</h1>
                        <SalesButton/>
                    </div>
                    <img 
                        src="/database/salesImgs/SalesImg1.jpg" 
                        alt="Sale 1" 
                        className="w-full h-full object-cover opacity-0"
                    />
                </div>
                <div className="relative h-[360px] sm:w-[48%] lg:w-[45%] bg-cover bg-center" 
                     style={{ backgroundImage: "url(/database/salesImgs/SalesImg2.jpg)" }}>
                    <div className="flex justify-evenly flex-col items-center absolute inset-0 bg-black bg-opacity-70">
                        <h1 className="salesTxt text-2xl font-semibold text-white">Promotion</h1>
                        <h1 className="salesTxt text-4xl font-semibold text-white">Student Discount</h1>
                        <SalesButton />
                    </div>
                    <img 
                        src="/database/salesImgs/SalesImg2.jpg" 
                        alt="Sale 2" 
                        className="w-full h-full object-cover opacity-0"
                    />
                </div>
            </div>
            <div className='ourBestSeller pb-12'>
                <div className='headerDiv flex py-10 justify-between'>
                    <h4 className='text-2xl font-semibold'>Last Pairs</h4>
                    <button className='pt-2 border-b-2 border-orange-400 hover:border-black duration-500 font-semibold tracking-wider'>VIEW ALL SALES</button>
                </div>
                <div className='mainGrid grid grid-flow-row grid-cols-3 gap-5 h-[100%]'>
                    {highQuickView &&
                        <div value className='quickViewContainer'>
                            <div value={''} onClick={highQuickViewChange} className='quickViewBg'></div>
                            <div className='quickViewDiv h-fit flex items-center'>
                                    <div value={''} onClick={highQuickViewChange} className='quickViewCloseBtn absolute'>
                                        <FontAwesomeIcon icon={faX} />
                                    </div>    
                                <div className='quickViewImg h-fit w-1/2 bg-[#f1f1ef]'>
                                    <img className='w-full' src={`${process.env.PUBLIC_URL}${highQuickVal[0].img}`}/>
                                </div>
                                <div className='quickViewContent w-1/2 px-[3%] p-[1.5%]'>
                                    <h2 className='text-3xl pb-5'>{highQuickVal[0].name}</h2>
                                        <Rating className='pb-5' name="half-rating-read " value={highQuickVal[0].rating || 0} precision={0.5} readOnly/>
                                    <p className='pb-5 font-semibold'>Auctor eros suspendisse tellus venenatis sodales purus non pellentesque amet,
                                    nunc sit eu, enim fringilla egestas pulvinar odio feugiat consectetur egestas magna
                                    pharetra cursus risus, lectus enim eget eu et lobortis faucibus.</p>
                                        <p className='pb-5 font-semibold'>SIZE: {shoesSize || 35} </p>
                                        <select onChange={sizeChanging} defaultValue={35} className='size w-[100%] border p-2 mb-5'>
                                            <option value='35'>35</option>
                                            <option value='36'>36</option>
                                            <option value='37'>37</option>
                                            <option value='38'>38</option>
                                            <option value='39'>39</option>
                                            <option value='40'>40</option>
                                            <option value='41'>41</option>
                                            <option value='42'>42</option>
                                            <option value='43'>43</option>
                                            <option value='44'>44</option>
                                            <option value='45'>45</option>
                                        </select>
                                        <h4 className='text-2xl pb-5'>{
                                        (
                                            highQuickVal[0].price.new == highQuickVal[0].price.old ? highQuickVal[0].price.old :
                                            <div className='flex'>
                                                <p className='line-through text-gray-300 me-2'>{highQuickVal[0].price.old}</p>
                                                <p className='text-black'>{highQuickVal[0].price.new}</p>
                                            </div>
                                        )
                                    }</h4>
                                        <div className='addToCartContainer flex justify-between pb-[8%] border-b border-gray-200'>
                                            <div className='flex h-fit'>
                                                <div onClick={removeShoes} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>-</div>
                                                <div  className='border px-3 pt-1.5 text-xl'>{shoesNum || 1}</div>
                                                <div onClick={addShoes} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>+</div>
                                            </div>
                                            <button onClick={addToCart} className='bg-[#6e7051] rounded-sm whitespace-nowrap text-white px-5'>ADD TO CART</button>
                                        </div>
                                        <div className='productShare flex gap-x-5 pt-[5%]'>
                                            <p className='font-semibold -mt-1'>SHARE: </p>
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faEnvelope} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faPinterestP} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faXTwitter} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faFacebook} />
                                            <FontAwesomeIcon className='text-xl cursor-pointer' icon={faInstagram} />
                                        </div>    
                                </div>
                            </div>
                        </div>
                    }
                    {saleShoes.map((item,index) =>
                        <div key={item.name} value={index} className='text-center flex flex-col relative '>
                            <img  value={index} onClick={highQuickViewChange} className='cursor-pointer hover:scale-[1.02] duration-[0.7s]' src={`${process.env.PUBLIC_URL}${item.img}`}/>
                            <h5  value={index} onClick={highQuickViewChange} className='cursor-pointer text-xl pt-3'>{item.name}</h5>
                            <div className='flex justify-center pt-3'>
                                {
                                    item.price.old == item.price.new ?
                                    <p className='text-gray-500 font-bold'>{item.price.old}</p> :
                                    <>
                                    <div className='sale bg-[#6e7051]'>Sale!</div>
                                    <p className='line-through text-gray-200 font-bold me-2'>{item.price.old}</p>
                                    <p className='text-gray-500 font-bold'>{item.price.new}</p>
                                </>
                                }
                            </div>
                            <div className='pt-3'>
                            <Rating name="half-rating-read" value={item.rating || 0} precision={0.5} readOnly />
                            </div>
                        </div>
                )}
                </div>
            </div>
        </div>
    );
}

