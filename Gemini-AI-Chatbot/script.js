const promptForm =document.querySelector(".prompt-form");
const container =document.querySelector(".container");
const chatsContainer =document.querySelector(".chats-container");
const promptInput =promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");



const API_KEY ="AIzaSyDqW_z-5akkyjkPnPkgafXdPKDMCJQMDy0";
const API_URL =`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

let typingInterval, controller;
let chatHistory =[];
const  userData ={message: "", file : {}};

//function to create message element
const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behaviour : "smooth"});

// simulate typing effect for bot reponses
const typingEffect =(text, textElement, botMsgDiv) =>{
    textElement.textContent ="";
    const words =text.split(" ");
    let wordIndex = 0;

// set an interval to type each wrod 
    typingInterval = setInterval(() =>{
        if(wordIndex < words.length) {
         textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
         botMsgDiv.classList.remove("loading"); 
         scrollToBottom();
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
    },40);
}
//making a API call and generate bot's response
const generateResponse = async(botMsgDiv)  => {
    const textElement =botMsgDiv.querySelector(".message-text");
    controller = new AbortController();
    //adding user and file data chat history 
    chatHistory.push({
        role:"user",
        parts:[{text: userData.message}, ...(userData.file.data ? [{ inline_data: (({ fileName, isImage, ...rest}) => rest )(userData.file)}] : [])]
    });
try {
const response = await fetch(API_URL, {
    method:"POST",
    headers: {"content-Type": "application/json"},
    body :JSON.stringify({contents:chatHistory}),
    signal:controller.signal
});
const data = await response.json();
if(!response.ok) throw new Error(data.error.message);

//process the response text and display it 
const responseText =data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
typingEffect(responseText, textElement,botMsgDiv);
chatHistory.push({
    role:"user", parts: [{ text: userData.message}]});
    console.log(chatHistory);

} catch(error) {
console.log(error);
} finally {
    userData.file ={};
}
}

//handle submit button
const handleFormSubmit = (e) => {
e.preventDefault();
const userMessage = promptInput.value.trim();
if(!userMessage || document.body.classList.contains("bot-responding")) return ;

promptInput.value = "";
userData.message = userMessage;
document.body.classList.add("bot-responding");
fileUploadWrapper.classList.remove("active", "img-attached", "file-attached")

//generate usermessage HTML and add in the chats container 
 // Generate user message HTML with optional file attachment
 const userMsgHTML = `
 <p class="message-text"></p>
 ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />` : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`) : ""}
`;
const userMsgDiv = createMsgElement(userMsgHTML,"user-message");

userMsgDiv.querySelector(".message-text").textContent = userMessage;
chatsContainer.appendChild(userMsgDiv);
scrollToBottom();

setTimeout(  ()=>{
    //generate botmessage HTML and add in the chats container 
const botMsgHTML = `<img src="gemini.svg" alt="" class="avatar"><p class="message-text">Just a sec..</p>`
const botMsgDiv = createMsgElement(botMsgHTML,"bot-message" ,"loading");
chatsContainer.appendChild(botMsgDiv);
scrollToBottom();
generateResponse(botMsgDiv)
},600);
}

//add file input
fileInput.addEventListener("change", () =>{
    const file =fileInput.files[0];
    if(!file) return;
    
    const isImage = file.type.startsWith("image/")
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload =(e) => {
        fileInput.value = "";
        const base64String = e.target.result.split(",")[1]
        fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
        fileUploadWrapper.classList.add("active", isImage ? "img-attached" :"file-attached");
        
        userData.file = { fileName :file.name, data: base64String, mime_type: file.type, isImage};
    }
}) ;

//cancel file upload 
document.querySelector("#cancel-file-btn").addEventListener("click" , () =>{
    userData.file ={}
    fileUploadWrapper.classList.remove("active","img-attached" ,"file-attached");
 } );

 //stop ongoing bot response
 document.querySelector("#stop-response-btn").addEventListener("click", () => {
    userData.file ={}
    controller?.abort();
    clearInterval(typingInterval);
    chatsContainer.querySelector(".bot-message.loading").classList.remove("loading");
    document.body.classList.remove("bot-responding");
  });

 //delete event 
 document.querySelector("#delete-chats-btn").addEventListener("click", () => {
    chatHistory.length = 0;
    chatsContainer.innerHTML = "";
    document.body.classList.remove("bot-responding");
  });

promptForm.addEventListener("submit",handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());

