var x=Object.create;var p=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var S=Object.getOwnPropertyNames;var T=Object.getPrototypeOf,b=Object.prototype.hasOwnProperty;var C=(e,r)=>{for(var n in r)p(e,n,{get:r[n],enumerable:!0})},m=(e,r,n,t)=>{if(r&&typeof r=="object"||typeof r=="function")for(let o of S(r))!b.call(e,o)&&o!==n&&p(e,o,{get:()=>r[o],enumerable:!(t=R(r,o))||t.enumerable});return e};var v=(e,r,n)=>(n=e!=null?x(T(e)):{},m(r||!e||!e.__esModule?p(n,"default",{value:e,enumerable:!0}):n,e)),z=e=>m(p({},"__esModule",{value:!0}),e);var k={};C(k,{cancelMeeting:()=>A,createMeeting:()=>h,createPayment:()=>f,initPlugin:()=>w,refundPayment:()=>P,updateMeeting:()=>E});module.exports=z(k);var y=v(require("axios"),1),u="",g="",w=e=>{u=e.apiUrl,g=e.apiKey},a=()=>y.default.create({baseURL:u,headers:{"Content-Type":"application/json","X-API-KEY":g}});var f=async e=>{let t=(await a().post("/payments",e)).data;if(t.gatewayType==="RAZORPAY")return await M(t);if(t.gatewayType==="STRIPE")return await _(t)},P=async e=>{let t=(await a().post(`/payments/refund?paymentId=${e}`)).data;return console.log("Refund response:",t),t},I=e=>new Promise(r=>{let n=document.createElement("script");n.src=e,n.onload=()=>r(!0),n.onerror=()=>r(!1),document.body.appendChild(n)}),M=async e=>{if(!await I("https://checkout.razorpay.com/v1/checkout.js"))throw new Error("Razorpay SDK failed to load");return new Promise((n,t)=>{let o={key:e.keyId,amount:e.amount,currency:e.currency,order_id:e.paymentId,handler:function(i){let s={gateway:"RAZORPAY",status:"SUCCESS",paymentId:i.razorpay_payment_id,orderId:i.razorpay_order_id,signature:i.razorpay_signature};n(s)},modal:{ondismiss:function(){t({gateway:"RAZORPAY",status:"CANCELLED"})}}},l=new window.Razorpay(o);console.log("Opening Razorpay..."),l.open()})},_=async e=>new Promise(async(r,n)=>{if(!await I("https://js.stripe.com/v3/")){n({gateway:"STRIPE",status:"FAILED",message:"Stripe SDK failed to load"});return}let o=window.Stripe(e.publishableKey),i=o.elements().create("card"),s=document.createElement("div");s.id="stripe-container",s.innerHTML=`
      <div style="
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:#00000080;
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:9999;
      ">
        <div style="background:white;padding:20px;width:400px">
          <h3>Stripe Payment</h3>
          <div id="card-element"></div>
          <br/>
          <button id="stripe-pay-btn">Pay</button>
        </div>
      </div>
    `,document.body.appendChild(s),i.mount("#card-element"),document.getElementById("stripe-pay-btn").addEventListener("click",async()=>{let d=await o.confirmCardPayment(e.clientSecret,{payment_method:{card:i}});if(d.error)n({gateway:"STRIPE",status:"FAILED",message:d.error.message});else{let c=d.paymentIntent;r({gateway:"STRIPE",status:c.status,paymentId:c.id,amount:c.amount,currency:c.currency})}document.getElementById("stripe-container").remove()})});var h=async e=>{let t=(await a().post("/meetings",{topic:e.topic,startTime:e.startTime,endTime:e.endTime,duration:e.duration,participants:Array.isArray(e.participants)?e.participants:[]})).data;return console.log("Create Meeting response:",t),t.joinUrl&&window.open(t.joinUrl,"_blank"),t},E=async e=>{let t=(await a().post("/meetings/update",{meetingId:e.meetingId,topic:e.topic,startTime:e.startTime,endTime:e.endTime,duration:e.duration,participants:Array.isArray(e.participants)?e.participants:[]})).data;return console.log("Update Meeting response:",t),t},A=async e=>{let t=(await a().post(`/meetings/cancel?meetingId=${e}`)).data;return console.log("Cancel Meeting response:",t),t};0&&(module.exports={cancelMeeting,createMeeting,createPayment,initPlugin,refundPayment,updateMeeting});
