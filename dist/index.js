import u from"axios";var l="",m="",g=e=>{l=e.apiUrl,m=e.apiKey},o=()=>u.create({baseURL:l,headers:{"Content-Type":"application/json","X-API-KEY":m}});var w=async e=>{let t=(await o().post("/payments",e)).data;if(t.gatewayType==="RAZORPAY")return await P(t);if(t.gatewayType==="STRIPE")return await I(t)},f=async e=>{let t=(await o().post(`/payments/refund?paymentId=${e}`)).data;return console.log("Refund response:",t),t},y=e=>new Promise(r=>{let n=document.createElement("script");n.src=e,n.onload=()=>r(!0),n.onerror=()=>r(!1),document.body.appendChild(n)}),P=async e=>{if(!await y("https://checkout.razorpay.com/v1/checkout.js"))throw new Error("Razorpay SDK failed to load");return new Promise((n,t)=>{let s={key:e.keyId,amount:e.amount,currency:e.currency,order_id:e.paymentId,handler:function(a){let i={gateway:"RAZORPAY",status:"SUCCESS",paymentId:a.razorpay_payment_id,orderId:a.razorpay_order_id,signature:a.razorpay_signature};n(i)},modal:{ondismiss:function(){t({gateway:"RAZORPAY",status:"CANCELLED"})}}},d=new window.Razorpay(s);console.log("Opening Razorpay..."),d.open()})},I=async e=>new Promise(async(r,n)=>{if(!await y("https://js.stripe.com/v3/")){n({gateway:"STRIPE",status:"FAILED",message:"Stripe SDK failed to load"});return}let s=window.Stripe(e.publishableKey),a=s.elements().create("card"),i=document.createElement("div");i.id="stripe-container",i.innerHTML=`
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
    `,document.body.appendChild(i),a.mount("#card-element"),document.getElementById("stripe-pay-btn").addEventListener("click",async()=>{let p=await s.confirmCardPayment(e.clientSecret,{payment_method:{card:a}});if(p.error)n({gateway:"STRIPE",status:"FAILED",message:p.error.message});else{let c=p.paymentIntent;r({gateway:"STRIPE",status:c.status,paymentId:c.id,amount:c.amount,currency:c.currency})}document.getElementById("stripe-container").remove()})});var h=async e=>{let t=(await o().post("/meetings",{topic:e.topic,startTime:e.startTime,endTime:e.endTime,duration:e.duration,participants:Array.isArray(e.participants)?e.participants:[]})).data;return console.log("Create Meeting response:",t),t.joinUrl&&window.open(t.joinUrl,"_blank"),t},E=async e=>{let t=(await o().post("/meetings/update",{meetingId:e.meetingId,topic:e.topic,startTime:e.startTime,endTime:e.endTime,duration:e.duration,participants:Array.isArray(e.participants)?e.participants:[]})).data;return console.log("Update Meeting response:",t),t},A=async e=>{let t=(await o().post(`/meetings/cancel?meetingId=${e}`)).data;return console.log("Cancel Meeting response:",t),t};export{A as cancelMeeting,h as createMeeting,w as createPayment,g as initPlugin,f as refundPayment,E as updateMeeting};
