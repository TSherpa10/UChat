import "./CSS/Messages.css";
import io from 'socket.io-client';
import handleFriend from "../JustinComponents/Friends.js"; //DFONG --> No need to have these import statements
import handleSwitch from "../JustinComponents/Friends.js";
import getFriendName from "../JustinComponents/Friends.js";  
// import getFriendLocation from "../JustinComponents/Friend.js";
import Friends from "../JustinComponents/Friends.js";
import Message from "../VeevekComponents/Message.js";
import { GetRoomData } from "../Data/GetData";

import {useState, useEffect, useContext, useRef} from "react";
import GlobalContext from "../GlobalContext";
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';


const socket = io();

const Messages = () => {
    const {user, setUser, room, setRoom} = useContext(GlobalContext);
    const [message, setMessage] = useState(""); 

    //These are refs to make sure the input msg box is focused on refresh
    //and that the msg scrolls down when messages are sent
    const inputRef = useRef(null);
    const msgSecRef = useRef(null);

   
    // TASHI 
    const handleDonation = () => {
        
    };

    const handleSubmit = (e) => {
        e.preventDefault(); 
        socket.emit('message', {userID: user._id, roomID: room.roomID, 
        message: message, roomNum: room.room, donation: room.donation, 
        donationAmount: room.donationAmount}); 
        setMessage(""); 
    }; 

    //DFONG --> Duplicate Function as above
    const handleMessage = () => {
        socket.emit('message', {userID: user._id, roomID: room.roomID, 
        message: message, roomNum: room.room, donation: room.donation, 
        donationAmount: room.donationAmount});
        setMessage(""); 
    }; 
    
    //When web page loads focus the cursor on the input message box.
    //If the user has friends join the room of the first friend
    useEffect(() => {
        inputRef.current.focus();
        if(user.friends.length !== 0){

            socket.emit('switch-room', room.room);
        }
    }, [room.room, user.friends.length]);


    //Every time messages are added make sure it automatically scrolls to bottom.
    useEffect(() => {
        msgSecRef.current.n = msgSecRef.current.scrollHeight;
    }, [room])


    useEffect(() => {
         /* This is where I will adding socket event listeners. 

            These even listeners will help me send data from the backend to
            the frontend. Once the data is retrieved on the front end state variables will be updated
            accordingly 


            EMIT ACTIONS: --> socket.emit(action, params)

            1. 'join-room', { userID: string, name: string, inUkraine: bool } 
            --> Used when user wants a new friend

            2. 'switch-room', room: string 
            --> Used when user switches to differnt friend (In the backend it switches the socket.io room)

            3. 'leave-room', room: string 
            --> Used before you write before you call switch room. MUST LEAVE ROOM BEFORE JOINING NEW ROOM

            4. 'message' { userID: string, roomID: string, message: string, roomNum: string, donation: bool, donationAmount: int } 
            --> USED WHEN NEW MESSAGE ENTERED
        */
        
        //Sent from Backend --> After backend finishes procesing adding a new room 
        //The website should add a new friend to the top of the side bar
        const joinRoomHandler = async({friendName, roomID, roomNum}) => {   
            let incomingFriend = {roomID: roomID, name: friendName}; 
            let newFriends = user.friends;
            newFriends.unshift(incomingFriend); 
            setUser({...user, friends: newFriends}); 

            const ret = await GetRoomData(roomID, friendName, roomNum); 
            socket.emit("leave-room", room.room); 
            socket.emit("switch-room", ret.room);
            setRoom(ret); 
        }

        //Sent from Backend --> After backend finishes procesing adding a new message
        //The website should add a mesage to the screen 
        const messageHandler = ({userID, message, _id, donation, donationAmount}) => {
            let incomingMessage = {_id: _id, userID: userID, message: message, 
            donation: donation, donationAmount: donationAmount}; 
            let newMessages = room.messages; 
            newMessages.push(incomingMessage); 
            setRoom({...room, messages: newMessages}); 
        }

        //Sent from Backend --> After second user wants to add a friend. 
        //First user updates friendUsername The website should update anonymous 
        // with new username
        const friendJoinedHandler = ({name, roomID}) => {
            let updatedUserFriend = user.friend; 
            updatedUserFriend.map((friend) => {
                if (friend.roomID === roomID) {
                    friend.name = name; 
                } 
                return friend; 
            }); 
            setUser({...user, friends: updatedUserFriend}); 
        }
        

        //Update user, make api request to update currentMessages
        socket.on('join-room', joinRoomHandler);

        socket.on('message', messageHandler);

        socket.on('friend-joined', friendJoinedHandler);

        return () => {
            socket.off('join-room', joinRoomHandler);
            socket.off('message',messageHandler);
            socket.off('friend-joined', friendJoinedHandler)
        }

    }, [room, setRoom, setUser, user]);


    return (
        <> 
            {/* a css grid that represents the whole page */}
            <section className="page">
                {/* the side part of the page that displays
                 the add friend button along with the friends  DFONG --> duplicate section??*/}
                <div className="sidebar">
                    {/* the add feature of the side */}
                    <div className="add-friend">
                        {/* the app name */}
                        <p>
                            UChat   
                        </p>

                        <PersonAddAlt1Icon 
                            className="add-button"
                            onClick={<handleFriend 
                                socket={socket} user={user}
                            />}
                            sx={{fontSize: 50}}
                        />
                    </div>

    
                    {/* the friends feature of the side */}
                    <div className="friends">
                        {/* there is a friend with a profile pic and their name */}
                        {   
                            user.friends.map(friend => {
                                return <Friends
                                    key={friend.roomID} 
                                    friend={friend} 
                                    socket={socket}
                                    onClick={<handleSwitch //DFONG --> Incorrect
                                        key={friend.roomID} socket={socket}
                                        aFriend={friend} user={user}
                                        room={room} GetRoomData={GetRoomData}
                                    />}
                                />; 
                            })
                        }
                    </div>
                </div>


                {/* now for the main part of the messages page 
                that includes the head, the chat UI, and the 
                messages input feature */}
                <div className="main">
                    <div className="header">
                        {/* the information regarding the friend w/
                        their profile picture, where they are from 
                        and their name */}
                        <section className="information">
                            {/* the profile picture */}
                            <div className="profile-pic">
                                <PersonIcon 
                                    className="icon"
                                    sx={{
                                        color: "white", 
                                        fontSize: 40
                                    }}
                                />
                            </div>
                            
                            {/* for the name and location */}
                            <div className="name-location">
                                <p className="id">
                                    <getFriendName 
                                        user={user}
                                        room={room}
                                    />
                                    Veevek
                                </p>

                                <p className="location">
                                    <getFriendLocation /> 
                                    From Kyiv
                                </p>
                            </div>
                        </section>
                        
                        {/* this is the donate button for TASHI*/}
                        <button className="donate" onClick={handleDonation}> 
                            Donate Now 
                        </button>
                    </div>



                    {/* the CHAT PART */}
                    <div className="messages-chat" ref={msgSecRef}>
                        {
                            room.messages.map(msg => {
                                return (
                                    <div className="message">  
                                        <Message key={msg._id} message={msg}/>
                                    </div>
                                );
                            })
                        }
                    </div>
                    

                    {/* THE INPUT PART WHERE YOU COLLECT THE DATA AND 
                    MANIPULATE IT*/}
                    <form className="message-input" onSubmit={handleSubmit}>
                        <input 
                            type="text"
                            className="message-box"
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            ref={inputRef}
                        />
                        {/* api request return value from getRoomData is used 
                        as onClick handler */}
                        <div className="enter-button" onClick={handleMessage}>
                            <SendIcon 
                                sx={{
                                    color: "white", 
                                    fontSize: 25 
                                }}
                            />
                        </div>
                    </form>
                </div>
            </section>
        </>
    );
}

export default Messages;