import CartStyle from './CartStyle.css'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDolly } from '@fortawesome/free-solid-svg-icons';

export default function Cart(){
        const [editProduct, setEditProduct] = useState(()=>
        {return JSON.parse(window.localStorage.getItem("item")) || null});
    const [cartProducts, setCartProducts] = useState(false);
    const [shoesNum, setShoesNum] = useState(() => {
        const savedItems = JSON.parse(window.localStorage.getItem("item"));
        return Array.isArray(savedItems)
            ? savedItems.map(item => item.shoesNumber || 1)
            : [];
    });
    const [shoesTotal, setShoesTotal] = useState(() => {return JSON.parse(window.localStorage.getItem("coupon")) ? JSON.parse(window.localStorage.getItem("coupon")) * shoesNum.reduce((acc, item) => acc + item, 0) * +(editProduct.reduce((acc,item) => acc + +item.price.new.replace('$',''),0)) : shoesNum.reduce((acc, item) => acc + item, 0) * +(editProduct.reduce((acc,item) => acc + +item.price.new.replace('$',''),0)) || 0});
    const [coupon, setCoupon] = useState(false);
    const [discount, setDiscount] = useState(() => JSON.parse(window.localStorage.getItem("discount")) ? true : false);
    console.log(shoesNum.reduce((acc, item) => acc + item, 0));
    useEffect(() => {
        window.addEventListener('storage', () => {
                    setShoesTotal(
                        editProduct.reduce((acc, item) => {
                            const price = parseFloat(item.price.new.replace('$', '')) * item.shoesNumber || 0; // Default to 0 if invalid
                            return acc + price;
                        }, 0)
                    );
                })
        setShoesNum(prevShoesNum => {
            const savedItems = JSON.parse(window.localStorage.getItem("item"));
            if (savedItems.length > prevShoesNum.length) {
                return [...prevShoesNum, ...new Array(savedItems.length - prevShoesNum.length).fill(1)];
            } else if (savedItems.length < prevShoesNum.length) {
                return prevShoesNum.slice(0, savedItems.length);
            }
            return prevShoesNum;
        });
    }, [JSON.parse(window.localStorage.getItem("item"))]);
    
    function changeShoesNum(e) {
        let curruntSliderId = e.target.innerHTML == '-' ? e.target.nextSibling.id : e.target.previousSibling.id;
        setCartProducts(true);
        const adjustment = e.target.innerHTML === '+' ? 1 : -1;
        setShoesNum(prevShoesNum => {
            return prevShoesNum.map((item, index) => 
                index == curruntSliderId 
                    ? Math.max(item + adjustment, 1)
                    : item
            );
        });
        window.dispatchEvent(new Event('storage'));
    }
useEffect(() => {
    const updatedProducts = JSON.parse(window.localStorage.getItem("item")).map((item, index) => ({
        ...item,
        shoesNumber: shoesNum[index], // Update `shoesNumber`
    }));
    localStorage.setItem("item", JSON.stringify(updatedProducts));
        window.dispatchEvent(new Event('storage'));

}, [shoesNum]);
function addCoupon(){
    let couponCode = document.getElementById('coupon').value;
    if(couponCode === 'MrZRZ' && shoesTotal != 0){
        setDiscount(true);
        window.localStorage.setItem('discount', 20);
    }
}
function deleteElement(e){
    let itemName = e.target.nextSibling.nextSibling.lastChild.innerHTML;
    console.log(e.target.nextSibling.nextSibling.lastChild.innerHTML);
    if (JSON.parse((window.localStorage.getItem('item')).length !== 0)) {
        const updatedShoppingElements = editProduct.filter(item => item.name !== itemName);
        setEditProduct(updatedShoppingElements);
        localStorage.setItem("item", JSON.stringify(updatedShoppingElements));
        window.dispatchEvent(new Event('storage'));
        localStorage.removeItem('loglevel');
        }
    }
    return(
        <div className='mainDiv bg-[#f1f1ef] flex justify-center items-center h-[fit-content] px-[12%] py-[2%] min-w-fit'>
            <div className='bg-white w-[100%] h-[100%] max-h-fit my-[3%] px-[5%] min-w-fit'>
                <h1 className='text-7xl font-semibold text-center py-[5%] border-[#6e7051] border-b-4'>Cart</h1>
                {editProduct.length != 0 ?
                <div className='tableWrapper max-h-fit flex gap-x-5 h-[100%] mt-2 mb-[2%]'>
                    <table className='table-auto w-[70%] h-[20%] border'>
                        <>
                            <tr className='tableHeader bg-[#f1f1ef] text-[black] border h-[8vh] text-lg font-semibold'>
                                <th className=''>Product</th>
                                <th className=''>Price</th>
                                <th className=''>Quantity</th>
                                <th className='text-start'>Subtotal</th>
                            </tr>
                            
                            { editProduct.map((item,index) =>
                                <tr className='tableRow border'>
                                    <td className='information flex items-center p-[3%] gap-x-[10%] ms-[5%] h-[100%]'>
                                        <p onClick={deleteElement} className='cartClosingBtn text-2xl text-[black] cursor-pointer'>x</p>
                                        <div className='imgContainer min-w-[80px] w-[80px] p-[1%]'>
                                            <img className='' src={`${process.env.PUBLIC_URL}${item.img}`}/>
                                        </div>
                                        <div className='productName font-semibold text-[black] '>
                                                <p className='txtTitle hidden'>Product name</p>
                                                <p className='txtValue'>{item.name}</p>
                                        </div>
                                        </td>
                                    <td className='totalPrice font-semibold text-[black] text-center'>{
                                        <div className='txtContainer flex justify-between'>
                                        <p className='txtTitle hidden'>Product total</p>
                                                {item.price.new == item.price.old ? <p className='txtValue'>{item.price.old}</p> :
                                                <span className='txtValue discountPrice'>
                                                        <p className='line-through text-gray-300'>{item.price.old}</p>
                                                        <p className='text-black'>{item.price.new}</p>
                                                    </span>
                                                    }
                                        </div>
                                        }</td>
                                    <td className='sliderContainer flex justify-between'>
                                        <p className='txtTitle font-semibold hidden'>Quantity</p>
                                        <div className='flex h-fit justify-center text-[black]'>
                                            <div onClick={changeShoesNum} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>-</div>
                                            <div id={index} className='border px-3 pt-1.5 text-xl select-none'>{cartProducts || ( shoesNum[index] == item.shoesNumber) && shoesNum ? shoesNum[index] : item.shoesNumber}</div>
                                            <div onClick={changeShoesNum} className='select-none border px-3 pb-1 text-3xl cursor-pointer'>+</div>
                                        </div>
                                    </td>
                                    <td className='productSubtotal txtContainer text-center text-[black] font-semibold'>
                                        <div className='flex'>
                                            <p className='txtTitle hidden w-full'>Product subtotal</p>
                                            <p className='txtValue'>${cartProducts || ( shoesNum[index] == item.shoesNumber) ? parseFloat((shoesNum[index] * item.price.new.replace('$', ''))).toFixed(2) : parseFloat(item.shoesNumber * item.price.new.replace('$', '')).toFixed(2)}</p>
                                        </div>
                                        </td>
                                </tr>
                            ) 
                        }
                    </>
                    </table>
                    <div className='w-[30%] mb-[2%] h-[fit-content] border'>
                        <h4 className='bg-[#f1f1ef] h-[8vh] text-2xl font-semibold flex items-center px-[7%]'>Cart totals</h4>
                        <div className='cartTotalContainer px-[7%] pb-[5%] text-lg text-[#a0a3a4] font-semibold'>

                            <div className='flex border-b justify-between py-5'>
                                <h6 className='txtTitle text-black'>Subtotal</h6>
                                <h6 className='txtValue font-semi-bold text-black'>${shoesTotal.toFixed(2) || null}</h6>
                            </div>
                            <div className='flex border-b justify-between items-center py-5'>
                                <h6 className='txtTitle text-black'>Total</h6>
                                <h6 className='txtValue font-semi-bold text-black'>{discount ? 
                                <div className=''>
                                    <p className='line-through me-[10%] text-gray-300'>${shoesTotal.toFixed(2) || null}</p>
                                    <p>${(shoesTotal * 0.8).toFixed(2)}</p>
                                </div>  : '$'+shoesTotal.toFixed(2)
                                }</h6>
                            </div>
                            {coupon ?
                             <div className='AddCoupon w-[100%] flex gap-x-[3%] min-w-[fit-content] mt-[25%]'>
                                <input id='coupon' className='border h-[fit-content] w-[70%] p-3 text-[1rem] text-black' type='text' placeholder='Coupon code'/>
                                <button onClick={addCoupon} className='bg-[#6e7051] text-[1rem] w-[40%] text-white duration-[0.8s] hover:bg-[#262b2c]'>APPLY</button>
                            </div> :
                             <p onClick={()=>setCoupon(true)} className='coupon cursor-pointer mt-[25%] text-black'>Have a coupon?</p>
                            }
                            <a href='/checkout'><button className='bg-[#6e7051] mt-[5%] text-white p-5 w-[100%] duration-[0.8s] hover:bg-[#262b2c]'>PROCEED TO CHECKOUT</button></a>
                        </div>
                    </div>
                </div>
                            :
                            <div className='mt-[1%] mb-[10%]'>
                                <div className='flex p-[3%] gap-x-[2%] bg-[#eee] '>
                                    <FontAwesomeIcon className='text-2xl mt-1.5 text-[#6e7051]' icon={faDolly} />
                                    <p className='text-xl'>Your cart is currently empty.</p>
                                </div>
                                <a href='/'><button className='bg-[#6e7051] text-[1.4rem] mt-[2%] text-white p-5 w-[100%] duration-[0.8s] hover:bg-[#262b2c]'>Return to shop</button></a>
                            </div>
                        }
            </div>
        </div>
    )
}