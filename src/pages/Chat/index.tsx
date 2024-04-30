  import React, { useState, useEffect, useRef } from "react";
  

  import axios from 'axios';
  import { initializeApp } from "firebase/app";
  import { getFirestore, collection, doc, setDoc, DocumentSnapshot } from 'firebase/firestore';
import { DocumentReference, getDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

  const firebaseConfig = {
    apiKey: "AIzaSyCc0oSHlqlX7fLeqqonODsOIC3XA8NI7hc",
    authDomain: "onboarding-a5fcb.firebaseapp.com",
    databaseURL: "https://onboarding-a5fcb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "onboarding-a5fcb",
    storageBucket: "onboarding-a5fcb.appspot.com",
    messagingSenderId: "334607574757",
    appId: "1:334607574757:web:2603a69bf85f4a1e87960c",
    measurementId: "G-2C9J1RY67L"
  };

  
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  interface Chat {
    id?: string;
    name?: string | "";
    last_message?: Message | null;
  }

  interface Message {
    id: string;
    text?: {
      body: string | "";
    };
    from_me?: boolean;
    createdAt?: number;
    type?: string;
    image?: {
      link?: string;
      caption?: string;
    };
  }

  function Main() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [isLoading, setLoading] = useState<boolean>(false); // Loading state
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null); 
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const WHAPI_BASE_URL = 'https://gate.whapi.cloud';
    let WHAPI_ACCESS_TOKEN = ''; // Replace with your Whapi access token
    let companyId='014';
    // Update the CSS classes for message bubbles
    const myMessageClass = "flex-end bg-green-500 max-w-30 md:max-w-md lg:max-w-lg xl:max-w-xl mx-1 my-0.5 p-2 rounded-md self-end ml-auto text-white text-right";
    const otherMessageClass = "flex-start bg-gray-700 md:max-w-md lg:max-w-lg xl:max-w-xl mx-1 my-0.5 p-2 rounded-md text-white self-start";

    

  

    let ghlConfig ={
      ghl_id:'',
      ghl_secret:'',
      refresh_token:'',
    };
    useEffect(() => {
      ghlToken();
    }, []);
  
    async function ghlToken() {
      try {
        await fetchConfigFromDatabase();
        const { ghl_id, ghl_secret, refresh_token} = ghlConfig;
        console.log('ghl_id:', ghl_id);
        console.log('ghl_secret:', ghl_secret);
        console.log('refresh_token:', refresh_token);
  
        const encodedParams = new URLSearchParams();
        encodedParams.set('client_id', ghl_id);
        encodedParams.set('client_secret', ghl_secret);
        encodedParams.set('grant_type', 'refresh_token');
        encodedParams.set('refresh_token', refresh_token);
        encodedParams.set('user_type', 'Location');
  
        const options = {
          method: 'POST',
          url: 'https://services.leadconnectorhq.com/oauth/token',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
          },
          data: encodedParams,
        };
  
        const { data: newTokenData } = await axios.request(options);
  
        await setDoc(doc(firestore, 'companies', '014'), {
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
        }, { merge: true });
  // Call the searchConversation function to initiate the search

        console.log('Token generation and update complete');
        await searchConversation(newTokenData.access_token);
      } catch (error) {
        console.error('Error generating and updating token:', error);
        throw error;
      }
    }
   
  // Function to search conversation using the obtained access token
// Function to search conversation using the obtained access token
async function searchConversation(accessToken: String) {
  try {
      const locationId = 'q0PjrC2cUCmoTcOudutf';
      const options = {
          method: 'GET',
          url: 'https://services.leadconnectorhq.com/contacts/',
          headers: {
              Authorization: `Bearer ${accessToken}`,
              Version: '2021-07-28',
          },
          params: {
              locationId: locationId
          }
      };

      const response = await axios.request(options);
      console.log('Search Conversation Response:', response.data);
   
  } catch (error) {
      console.error('Error searching conversation:', error);
  }
}


    async function fetchConfigFromDatabase() {
      const auth = getAuth(app);
      const user = auth.currentUser;
      try {
      
        if(user?.email === 'admin@beverly.com'){
          companyId='014';
        }
        else if(user?.email === 'admin@billert.com'){
          companyId='011';
        }
        const docRef = doc(firestore, 'companies', companyId);
        const docSnapshot: DocumentSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists()) {
          console.log('No such document!');
          return;
        }
        const data = docSnapshot.data();
        ghlConfig = {
          ghl_id: data.ghl_id,
          ghl_secret: data.ghl_secret,
          refresh_token: data.refresh_token
        };
        console.log('Document data:', data);
        WHAPI_ACCESS_TOKEN =data.whapiToken;
  
        await fetchChatsWithRetry();
      } catch (error) {
        console.error('Error fetching config:', error);
        throw error;
      }
    }
    const fetchChatsWithRetry = async () => {
      try {
        setLoading(true); // Set loading to true before fetching chats
    
        const options = {
          method: 'GET',
          url: `${WHAPI_BASE_URL}/chats`,
          headers: {
            'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`,
            'accept': 'application/json'
          }
        };
    
        const response = await axios.request(options);
    
        if (!response.data) {
          throw new Error('Failed to fetch chats');
        }
    
        const data = response.data;
        console.log(data);
        setChats(data.chats.map((chat: any) => ({ ...chat })));
    
        // Exit the function if chats are fetched successfully
        return;
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching chats
      }
    
      console.error('Failed to fetch chats');
    };
  
 
  // Function to clear messages when a non-WhatsApp icon is clicked
  const handleIconClick =  (iconId: string) => {

    setMessages([]);
    setSelectedIcon(iconId);
  };
  const handleWhatsappClick =  (iconId: string) => {
    // Clear selected chat and messages
    setSelectedIcon(iconId);
    const fetchMessagesWithRetry = async () => {
      if (!selectedChatId) return;

      let retryCount = 0;
      const maxRetries = 20;
      const retryDelay = 1; // 1 second

      while (retryCount < maxRetries) {
        try {
          setLoading(true); // Set loading to true before fetching messages
          const response = await fetch(`${WHAPI_BASE_URL}/messages/list/${selectedChatId}`, {
            headers: {
              'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }

          const data = await response.json();
          console.log('Messages:', data);
          setMessages(data.messages.map((message: any) => ({
            id: message.id,
            text: {
              body: message.text ? message.text.body : ""
            },
            from_me: message.from_me,
            createdAt: message.timestamp,
            type: message.type,
            image: message.image ? message.image : undefined // Use undefined instead of empty string
          })));
          
          // Exit the loop if messages are fetched successfully
          return;
        } catch (error) {
          console.error('Failed to fetch messages:', error);

          // Increment the retry count
          retryCount++;

          // Wait for retryDelay milliseconds before trying again
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } finally {
          setLoading(false); // Set loading to false after fetching messages
        }
      }

      console.error(`Failed to fetch messages after ${maxRetries} retries`);
    };

    fetchMessagesWithRetry();
    [selectedChatId]
  };

   
useEffect(() => {
  const fetchMessagesWithRetry = async () => {
    if (!selectedChatId) return;

    try {
      setLoading(true); // Set loading to true before fetching messages

      const options = {
        method: 'GET',
        url: `${WHAPI_BASE_URL}/messages/list/${selectedChatId}`,
        headers: {
          'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`,
          'accept': 'application/json'
        }
      };

      const response = await axios.request(options);

      if (!response.data) {
        throw new Error('Failed to fetch messages');
      }

      const data = response.data;
      console.log('Messages:', data);
      setMessages(data.messages.map((message: { id: any; text: { body: any; }; from_me: any; timestamp: any; type: any; image: any; }) => ({
        id: message.id,
        text: { body: message.text ? message.text.body : "" },
        from_me: message.from_me,
        createdAt: message.timestamp,
        type: message.type,
        image: message.image ? message.image : undefined
      })));

      // Exit the function if messages are fetched successfully
      return;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false); // Set loading to false after fetching messages
    }

    console.error('Failed to fetch messages');
  };

  fetchMessagesWithRetry();
}, [selectedChatId]);
    const handleSendMessage = async () => {
      if (!newMessage.trim() || !selectedChatId) return;

      try {
        const response = await fetch(`${WHAPI_BASE_URL}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            chatId: selectedChatId,
            text: newMessage
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        const newMsg: Message = {
          id: data.messageId,
          text: {
            body: newMessage
          },
          type: "text",
          from_me: true,
          createdAt: 0
        };
        setMessages([...messages, newMsg]);
        setChats(chats.map(chat =>
          chat.id === selectedChatId ? { ...chat, last_message: newMsg } : chat
        ));

        setNewMessage("");
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    };

    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'visible';
      };
    }, []);
    const handleContextMenu = (e: React.MouseEvent, message: Message) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, message);
    };
  
    const showContextMenu = (x: number, y: number, message: Message) => {
      const contextMenu = document.getElementById('contextMenu');
      if (contextMenu) {
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        setSelectedMessage(message);
        handleForwardToChat(message.id);
      }
    };
  
    const handleForwardToChat = (chatId: string) => {
      if (selectedMessage) {
        handleForwardMessage(selectedMessage, chatId);
        hideContextMenu();
      }
    };
  
    const hideContextMenu = () => {
      const contextMenu = document.getElementById('contextMenu');
      if (contextMenu) {
        contextMenu.style.display = 'none';
      }
    };
  
    const handleForwardMessage = async (message: Message, chatId: string) => {
      try {
        const response = await axios.post(`${WHAPI_BASE_URL}/messages/forward`, {
          chatId,
          messageId: message.id
        }, {
          headers: {
            'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`
          }
        });
  
        // Handle success
      } catch (error) {
        console.error('Failed to forward message:', error);
        // Handle error
      }
    };
    const handleRefreshClick = () => {
      // Add your refresh logic here
      console.log('Refresh clicked');
      const fetchChatsWithRetry = async () => {
        let retryCount = 0;
        const maxRetries = 10;
        const retryDelay = 1000; // 1 second
    
        while (retryCount < maxRetries) {
          try {
            setLoading(true); // Set loading to true before fetching chats
            const response = await fetch(`${WHAPI_BASE_URL}/chats`, {
              headers: {
                'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`
              }
            });
    
            if (!response.ok) {
              throw new Error('Failed to fetch chats');
            }
    
            const data = await response.json();
            console.log(data);
            setChats(data.chats.map((chat: Chat) => ({
              ...chat,
            })));
            fetchMessagesWithRetry();
            
            // Exit the loop if chats are fetched successfully
            return;
          } catch (error) {
            console.error('Failed to fetch chats:', error);
    
            // Increment the retry count
            retryCount++;
    
            // Wait for retryDelay milliseconds before trying again
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } finally {
            setLoading(false); // Set loading to false after fetching chats
          }
        }
    
        console.error(`Failed to fetch chats after ${maxRetries} retries`);
      };
    
      fetchChatsWithRetry();
      const fetchMessagesWithRetry = async () => {
        if (!selectedChatId) return;

        let retryCount = 0;
        const maxRetries = 10;
        const retryDelay = 1000; // 1 second

        while (retryCount < maxRetries) {
          try {
            setLoading(true); // Set loading to true before fetching messages
            const response = await fetch(`${WHAPI_BASE_URL}/messages/list/${selectedChatId}`, {
              headers: {
                'Authorization': `Bearer ${WHAPI_ACCESS_TOKEN}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to fetch messages');
            }

            const data = await response.json();
            console.log('Messages:', data);
            setMessages(data.messages.map((message: any) => ({
              id: message.id,
              text: {
                body: message.text ? message.text.body : ""
              },
              from_me: message.from_me,
              createdAt: message.timestamp,
              type: message.type,
              image: message.image ? message.image : undefined // Use undefined instead of empty string
            })));
            
            // Exit the loop if messages are fetched successfully
            return;
          } catch (error) {
            console.error('Failed to fetch messages:', error);

            // Increment the retry count
            retryCount++;

            // Wait for retryDelay milliseconds before trying again
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } finally {
            setLoading(false); // Set loading to false after fetching messages
          }
        }

        console.error(`Failed to fetch messages after ${maxRetries} retries`);
      };

    
    };
    function adjustTextareaHeight() {
      const textarea = inputRef.current;
      if (textarea) {
        console.log("Textarea:", textarea);
        textarea.style.height = 'auto'; // Reset the height to auto to ensure accurate height calculation
        textarea.style.height = textarea.scrollHeight + 'px'; // Set the height to match the content height
      }
    }
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="w-1/4 p-4 overflow-y-auto">
    
          <div>
        
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-2 mb-2 rounded cursor-pointer ${selectedChatId === chat.id ? 'bg-gray-300' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedChatId(chat.id!)}
              >
                <span className="font-semibold">{chat.name??chat.id}</span>
                {chat.last_message && (
                  <span className="text-gray-500 block" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {chat.last_message.text && chat.last_message.text.body ? chat.last_message.text.body : 'No Messages'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-3/4 p-4 bg-wblack overflow-y-auto relative">
      



          <div className="overflow-y-auto" style={{ paddingBottom: "200px" }}>
          {isLoading && (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-opacity-50 ">
          <div className=" items-center absolute top-1/2 left-2/2 transform -translate-x-1/3 -translate-y-1/2 bg-white p-4 rounded-md shadow-lg">
          <div role="status">
        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
       
    </div>
  
          </div>
        </div>
      )}

            {messages.slice().reverse().map((message) => (
              <div
                key={message.id}
                className={`p-2 mb-2 rounded ${
                  message.from_me ? myMessageClass : otherMessageClass
                }`}
                onClick={(e) => handleContextMenu(e, message)}
                onContextMenu={(e) => handleContextMenu(e, message)}
                style={{
                  maxWidth: '70%', // Set max-width to avoid text clipping
                  width: `${
                    message.type === 'image'
                      ? '320'
                      : Math.min(message.text!.body!.length * 15, 350)
                  }px`, // Limit width to 300px if there's no image
                  
                }}
       
              >
                {message.type === 'image' && message.image && (
                  <div className="message-content image-message">
                    <img
                      src={message.image.link}
                      alt="Image"
                      className="message-image"
                      style={{ maxWidth: '300px' }} // Adjust the width as needed
                    />
                    <div className="caption">{message.image.caption}</div>
                  </div>
                )}
                {message.type === 'text' && (
                  <div className="message-content"         onClick={(e) => handleContextMenu(e, message)}
                  onContextMenu={(e) => handleContextMenu(e, message)}>
                    {message.text!.body}
                  </div>
                  
                )}
               
              </div>
            ))}

            <div ref={messagesEndRef}></div>
            <div className="fixed bottom-0 w-full bg-white border-t border-gray-300 py-2 px-10 flex items-center">
            <div className="message-source-buttons flex items-center">
      <img
        className={`source-button ${selectedIcon === 'ws' ? 'border-2 border-blue-500' : ''}`}
        src="https://firebasestorage.googleapis.com/v0/b/onboarding-a5fcb.appspot.com/o/icon4.png?alt=media&token=d4ab65b6-9b90-4aca-9d69-6263300a91ec"
        alt="WhatsApp"onClick={() => handleWhatsappClick('ws')}
        style={{ width: '30px', height: '30px' }} // Adjust size as needed
      />
      <img
        className={`source-button ${selectedIcon === 'fb' ? 'border-2 border-blue-500' : ''}`}
        src="https://firebasestorage.googleapis.com/v0/b/onboarding-a5fcb.appspot.com/o/facebook-logo-on-transparent-isolated-background-free-vector-removebg-preview.png?alt=media&token=c312eb23-dfee-40d3-a55c-476ef3041369"
        alt="Facebook"onClick={() => handleIconClick('fb')}
        style={{ width: '30px', height: '30px' }} // Adjust size as needed
      />
      <img
        className={`source-button ${selectedIcon === 'ig' ? 'border-2 border-blue-500' : ''}`}onClick={() => handleIconClick('ig')}
        src="https://firebasestorage.googleapis.com/v0/b/onboarding-a5fcb.appspot.com/o/icon3.png?alt=media&token=9395326d-ff56-45e7-8ebc-70df4be6971a"
        alt="Instagram"
        style={{ width: '30px', height: '30px' }} // Adjust size as needed
      />
      <img
        className={`source-button ${selectedIcon === 'gmb' ? 'border-2 border-blue-500' : ''}`}onClick={() => handleIconClick('gmb')}
        src="https://firebasestorage.googleapis.com/v0/b/onboarding-a5fcb.appspot.com/o/icon1.png?alt=media&token=10842399-eca4-40d1-9051-ea70c72ac95b"
        alt="Google My Business"
        style={{ width: '20px', height: '20px' }} // Adjust size as needed
      />
      <img
        className={`source-button ${selectedIcon === 'mail' ? 'border-2 border-blue-500' : ''}`}onClick={() => handleIconClick('mail')}
        src="https://firebasestorage.googleapis.com/v0/b/onboarding-a5fcb.appspot.com/o/icon2.png?alt=media&token=813f94d4-cad1-4944-805a-2454293278c9"
        alt="Email"
        style={{ width: '30px', height: '30px' }} // Adjust size as needed
      />
       <div className="border-r border-black-400 h-full"  style={{ width: '25px', height: '30px' }}></div>
    </div>
   
    <div className="flex items-center justify-between w-2/5"> {/* Adjusted width for the container */}
    <textarea

  className="flex-1 px-4 py-2 border border-gray-400 rounded-l-lg focus:outline-none focus:border-blue-500 text-lg mr-2 resize-none" // Adjusted width for the textarea and added margin to separate it from the button
  placeholder="Type a message"
  value={newMessage}
  onChange={(e) => {
    setNewMessage(e.target.value);
    
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevents the default behavior of adding a new line in the textarea
   handleSendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      adjustTextareaHeight();
    }
  }}
/>

  <button
    className="bg-blue-500 text-white px-4 py-4 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
    onClick={handleSendMessage}
  >
    Send
  </button>
</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export default Main;
