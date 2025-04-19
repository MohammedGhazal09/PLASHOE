import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react';
import { faX } from '@fortawesome/free-solid-svg-icons'
import { faStar, faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faPinterestP, faXTwitter , faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import HomeContentStyle from './HomeContentStyle.css'
import asSeen1 from '../../Imgs/zeroz/asSeen1.png'
import asSeen2 from '../../Imgs/zeroz/asSeen2.png'
import asSeen3 from '../../Imgs/zeroz/asSeen3.png'
import asSeen4 from '../../Imgs/zeroz/asSeen4.png'
import asSeen5 from '../../Imgs/zeroz/asSeen5.png'
import aboutUsImg from '../../Imgs/zeroz/aboutUsImg.jpg'
import shoes from '../../Imgs/zeroz/shoes.png'
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import RecycledImg from '../../Imgs/zeroz/RecycledImg.png'
import VeganImg from '../../Imgs/zeroz/VeganImg.png'
import handMadeImg from '../../Imgs/zeroz/handMadeImg.png'
import recycledBigImg from '../../Imgs/zeroz/recycledBigImg.jpg'
import JuliaImg from "../../Imgs/zeroz/JuliaKeys.jpg"
import LuisImg from "../../Imgs/zeroz/LuisAdrian.jpg"
import MariaImg from "../../Imgs/zeroz/MariaAnna.jpg"
export default function HomeContent() {
    const [female, setFemale] = useState([]);
    const [male, setMale] = useState([]);
     async function test(){
        try{
            const response = await fetch(`${window.location}database/database.json`);
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
    let highRating = female.concat(male).filter((item) => item.rating >= 4.5).sort((a, b) => b.rating - a.rating);
    let newArrival = female.concat(male).filter((item) => item.rating == 0);
    const [highQuickView, setHighQuickView] = useState(false);
    const [latestQuickView, setLatestQuickView] = useState(false);
    const [shoesSize, setShoesSize] = useState("")
    const [highQuickVal, setHighQuickVal] = useState('');
    const [latestQuickVal, setLatestQuickVal] = useState('');
    const highQuickViewChange = (e) => {
        setHighQuickView(!highQuickView);
        setShoesNum(1);
        setShoesSize(35);
        if(document.querySelector('body').style.overflow == 'hidden'){
            document.querySelector('body').style.overflow = 'visible';
        }else{
            document.querySelector('body').style.overflow = 'hidden';
        }
        if(e.target.textContent != ''){
            setHighQuickVal(highRating.filter(item => item.name == e.target.textContent )|| "");
            
        }else{
            setHighQuickVal(highRating.filter(item => (`${window.location}${item.img.substr(1)}`).toString() == e.target.src) || "");
        }
            setShoesNum(1);
        }
    const latestQuickViewChange = (e) => {
        setLatestQuickView(!latestQuickView);
        setShoesSize(35);
        if(document.querySelector('body').style.overflow == 'hidden'){
            document.querySelector('body').style.overflow = 'visible';
        }else{
            document.querySelector('body').style.overflow = 'hidden';
        }
        if(e.target.textContent != ''){
            setLatestQuickVal(newArrival.filter(item => item.name == e.target.textContent) || "");
            
        }else{
            setLatestQuickVal(newArrival.filter(item => (`${window.location}${item.img.substr(1)}`).toString() == e.target.src) || "");
        }
        setShoesNum(1);
        }
    let sizeValue = '';
    function sizeChanging(){        
        let getSize = document.querySelector('.size');
        setShoesSize(sizeValue = getSize.value || 35);
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
        const currentItems = JSON.parse(localStorage.getItem("item")) || [];
        const updatedItems = [...currentItems, itemToAdd];
        localStorage.setItem("item", JSON.stringify(updatedItems));
        window.dispatchEvent(new Event('storage'));
        setShoesNum(1);
    }
    return (
        <div>
            <div className='homeFirstDiv'>
                <h1 className='text-7xl w-4/12 leading-tight font-semibold text-white mb-7'>Love the Planet we walk on</h1>
                <p className='text-lg text-white w-4/12 mb-7'>
                    Bibendum fermentum, aenean donec pretium aliquam blandit tempor imperdiet arcu arcu ut nunc in dictum mauris at ut.
                </p>
                <div className='flex flex-row'>
                    <button className='bg-white py-3 px-8 font-semibold me-7'><a href='/men'>SHOP MEN</a></button>
                    <button className='bg-white py-3 px-8 font-semibold'><a href='/women'>SHOP WOMEN</a></button>
                </div>
            </div>

            <div className='asSeenIn flex justify-center items-center gap-x-8'>
                <p className='text-lg font-medium -mt-1'>As seen in:</p>
                <div className='flex justify-center mx-6'>
                    <img src={asSeen1} alt="Seen in media 1" />
                    <img src={asSeen2} alt="Seen in media 2" />
                    <img src={asSeen3} alt="Seen in media 3" />
                    <img src={asSeen4} alt="Seen in media 4" />
                    <img src={asSeen5} alt="Seen in media 5" />
                </div>
            </div>

            <div className='aboutUs flex justify-center items-center gap-x-10 px-10 pt-10'>
                <img className='py-20' src={aboutUsImg} alt="About us" />
                <div className='p-10 pt-5 max-w-[100%]'>
                    <h6 className='text-lg py-10 text-orange-400'>About Us</h6>
                    <h2 className='text-5xl font-semibold pb-10'>
                        Selected materials designed for comfort and sustainability
                    </h2>
                    <p className='text-gray-400'>
                        Nullam auctor faucibus ridiculus dignissim sed et auctor sed eget auctor nec sed elit nunc, magna non urna amet ac neque ut quam enim pretium risus gravida ullamcorper adipiscing at ut magna.
                    </p>
                    <button className='font-semibold border-b-2 border-orange-400 mt-10'>READ MORE</button>
                </div>
            </div>
            <div className='seeHowMadeDiv pb-20'>
                <h2 className='text-5xl font-semibold text-center py-10'>See how your shoes are made</h2>
                <p className='text-gray-400 text-center mx-auto pb-5 w-5/12 font-semibold'>Urna, felis enim orci accumsan urna blandit
                egestas mattis egestas feugiat viverra ornare donec adipiscing semper aliquet integer
                risus leo volutpat nulla enim ultrices.</p>
                <div className=' makingContainer grid grid-flow-col grid-cols-3'>
                    <div className='beforeImg pt-10 w-5/12 mx-auto text-start'>
                        <h6 className='text-orange-400 font-semibold mb-3'>01.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Pet canvas</h4>
                        <p className='text-gray-400'>Morbi eget bibendum sit adipiscing morbi ac nisl vitae maecenas nulla cursus</p>
                    </div>
                    <div className='beforeImg pt-10 w-5/12 mx-auto text-start'>
                        <h6 className='text-orange-400 font-semibold mb-3'>02.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Algae foam + vegan glue</h4>
                        <p className='text-gray-400'>Enim tincidunt donec vulputate magna pharetra mattis in</p>
                    </div>
                    <div className='shoes pt-10 row-span-2 my-auto col-start-2 row-start-1'>
                        <img className='' src={shoes}/>
                    </div>
                    <div className='afterImg pt-10 w-5/12 mx-auto text-end'>
                        <h6 className='text-orange-400 font-semibold mb-3'>03.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Organic cotton</h4>
                        <p className='text-gray-400'>A vel ipsum, sed dignissim elementum ultrices amet</p>
                    </div>
                    <div className='afterImg pt-10 w-5/12 mx-auto text-end'>
                        <h6 className='text-orange-400 font-semibold mb-3'>04.</h6>
                        <h4 className='text-2xl font-semibold mb-3'>Upcycled plastic bottles</h4>
                        <p className='text-gray-400'>Pellentesque viverra amet netus facilisis amet felis odio tortor orci cursus est</p>
                    </div>
                </div>
            </div>
            <div className='homeShoes pb-14'>
                <div className='headerDiv flex py-10 justify-between'>
                    <h4 className='text-2xl font-semibold'>Our Best Seller</h4>
                    <button className='pt-2 border-b-2 border-orange-400 hover:border-black duration-500 font-semibold tracking-wider'>VIEW ALL BEST SELLERS</button>
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
                    {highRating.map((item,index) =>
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
            <div className='menOrWomenRoute flex justify-center py-10 mb-10 p-10 gap-x-10'>
                <div id='menRoute' className='flex flex-col justify-center items-center'>
                    <h3 className='font-semibold text-white text-4xl pb-5'>Men</h3>
                    <a className='' href='/men'>
                        <button className='border-2 font-semibold border-white text-white px-8 py-3'>
                            SHOP MEN
                        </button>
                    </a>
                </div>
                <div id='womenRoute' className='flex flex-col justify-center items-center'>
                    <h3 className='font-semibold text-white text-4xl pb-5'>Women</h3>
                    <a className='' href='/women'>
                        <button className='border-2 font-semibold border-white text-white px-8 py-3'>
                        SHOP WOMEN
                        </button>
                    </a>
                </div>
            </div>
            <div className='homeShoes pb-14'>
                <div className='headerDiv flex py-10 justify-between'>
                    <h4 className='text-2xl font-semibold'>New Arrivals</h4>
                    <button className='pt-2 border-b-2 border-orange-400 whitespace-nowrap hover:border-black duration-500 font-semibold tracking-wider'>VIEW ALL NEW ARRIVALS</button>
                </div>
                <div className='mainGrid grid grid-flow-row grid-cols-3 gap-5 h-[100%]'>
                    {latestQuickView &&
                        <div className='quickViewContainer'>
                            <div value={''} onClick={latestQuickViewChange} className='quickViewBg'></div>
                            <div className='quickViewDiv h-fit flex items-center p-[1.5%]'>
                                    <div value={''} onClick={latestQuickViewChange} className='quickViewCloseBtn absolute'>
                                        <FontAwesomeIcon icon={faX} />
                                    </div>    
                                <div className='quickViewImg h-fit w-1/2 bg-[#f1f1ef]'>
                                    <img className='w-full' src={`${process.env.PUBLIC_URL}${latestQuickVal[0].img}`}/>
                                </div>
                                <div className='quickViewContent w-1/2 px-[3%]'>
                                    <h2 className='text-3xl pb-5'>{latestQuickVal[0].name}</h2>
                                        <Rating className='pb-5' name="half-rating-read " value={newArrival[0].rating || 0} precision={0.5} readOnly/>
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
                                            newArrival[0].price.new == newArrival[0].price.old ? newArrival[0].price.old :
                                            <div className='flex'>
                                                <p className='line-through text-gray-300 me-2'>{newArrival[0].price.old}</p>
                                                <p className='text-black'>{newArrival[0].price.new}</p>
                                            </div>
                                        )
                                    }</h4>
                                        <div className='addToCartContainer flex justify-between pb-[8%] border-b border-gray-200'>
                                            <div className='flex h-fit'>
                                                <div onClick={removeShoes} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>-</div>
                                                <div  className='border px-3 pt-1.5 text-xl cursor-pointer'>{shoesNum || 1}</div>
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
                    {newArrival.map((item,index) =>
                        <div key={item.name} value={index} className='text-center flex flex-col relative'>
                            <img  value={index} onClick={latestQuickViewChange} className='cursor-pointer hover:scale-[1.02] duration-[0.7s]' src={`${process.env.PUBLIC_URL}${item.img}`}/>
                            <h5  value={index} onClick={latestQuickViewChange} className='cursor-pointer text-xl pt-3'>{item.name}</h5>
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
            <div className='shoesEmv flex justify-center items-center bg-[#f1f1ef] h-[60vh] max-w-[100%]  m-[1.5%]'>
                <div className='w-[40%] pe-[10%]'>
                    <p className='text-gray-500 pb-[15%] text-lg'>Eu eget felis erat mauris aliquam mattis lacus,
                    arcu leo aliquam sapien pulvinar laoreet vulputate sem aliquet phasellus egestas felis,
                    est, vulputate morbi massa mauris vestibulum dui odio.</p>
                    <div className='shoesEmvImgContainer flex justify-center'>
                        <img className='me-[8%]' src={RecycledImg}/>
                        <img className='me-[8%]' src={VeganImg}/>
                        <img className='' src={handMadeImg}/>
                    </div>
                </div>
                <div className='rounded-[50%] border-dashed border-2 border-[#6e7051]'>
                    <img className='rounded-[50%]' src={recycledBigImg}/>
                </div>
            </div>
            <div className='flex flex-col justify-center my-[4%] h-fit'>
                <h2 className='text-4xl text-center font-semibold'>Our Customers Speak For Us</h2>
                <div className='customersSpeak flex justify-center gap-x-[2%] mx-[1.5%] my-[3%] '>
                    <div className='customersSpeakDiv w-[25vw] h-[30vh] min-h-fit p-[2%] border'>
                        <Rating className='' name="size-small" value={4.75} precision={0.25} readOnly />
                        <h6 className='mt-[2%] font-semibold text-[1.1rem]'>“Felis semper duis massa scelerisque ac amet porttitor ac tellus
                        venenatis aliquam varius mauris integer”</h6>
                        <div className='flex mt-[5%]'>
                            <Avatar alt="Remy Sharp" src={JuliaImg} />
                            <h5 className='ms-[5%] text-gray-400 mt-3'>JULIA KEYS</h5>
                        </div>
                    </div>
                    <div className='customersSpeakDiv w-[25vw] h-[30vh] p-[2%] border'>
                        <Rating name="size-small" value={4.75} precision={0.25} readOnly />
                        <h6 className='mt-[2%] font-semibold text-[1.1rem]'>“Non malesuada fringilla non varius odio in id pellentesque aliquam
                        volutpat sapien faucibus ”</h6>
                        <div className='flex mt-[5%]'>
                            <Avatar alt="Remy Sharp" src={LuisImg} />
                            <h5 className='ms-[5%] text-gray-400 mt-3'>Luis Adrain</h5>
                        </div>
                    </div>
                    <div className='customersSpeakDiv w-[25vw] h-[30vh] p-[2%] border'>
                        <Rating name="size-small" value={4.75} precision={0.25} readOnly />
                        <h6 className='mt-[2%] font-semibold text-[1.1rem]'>“Tortor suspendisse tincidunt accumsan platea pellentesque hac.”</h6>
                        <div className='flex mt-[5%]'>
                            <Avatar alt="Remy Sharp" src={MariaImg} />
                            <h5 className='ms-[5%] text-gray-400 mt-3'>Maria Anna</h5>
                        </div>
                    </div>
                </div>
                <h5 className='text-gray-400 font-semibold text-center text-lg px-[2%]'>4.8 average rating from 1814 reviews</h5>
            </div>
        </div>
    );
}
