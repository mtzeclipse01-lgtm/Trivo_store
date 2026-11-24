const $ = (s) => document.querySelector(s);
let selected = null;
const money = n => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
async function loadProducts(){
 const host=$("#products");
 try{
  const res=await fetch("/api/products"); const products=await res.json();
  host.innerHTML=products.map((p,i)=>`<article class="product"><div class="product-icon">${["⚔","✦","♛"][i%3]}</div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><div class="price">${money(p.price)}</div><button class="buy" data-id="${p.id}">ADQUIRIR PRODUTO ↗</button></article>`).join("");
  host.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>openProduct(products.find(p=>p.id===b.dataset.id))));
 }catch{host.textContent="Não foi possível carregar os produtos."}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function openProduct(p){selected=p;$("#chosenName").textContent=p.name;$("#chosenDesc").textContent=`${p.description} • ${money(p.price)}`;$("#formError").textContent="";$("#modal").classList.remove("hidden");$("#player").focus();}
$("#close").onclick=()=>$("#modal").classList.add("hidden");
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")$("#modal").classList.add("hidden")});
$("#buyForm").addEventListener("submit",async e=>{
 e.preventDefault(); if(!selected)return;
 const button=e.submitter; button.disabled=true; button.textContent="AGUARDE...";
 $("#formError").textContent="";
 try{
  const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({player:$("#player").value.trim(),productId:selected.id})});
  const data=await response.json(); if(!response.ok)throw new Error(data.error||"Falha ao iniciar pagamento.");
  location.href=data.checkoutUrl;
 }catch(err){$("#formError").textContent=err.message;button.disabled=false;button.textContent="CONTINUAR PARA PAGAMENTO ↗";}
});
loadProducts();