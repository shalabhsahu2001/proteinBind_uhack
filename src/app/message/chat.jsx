"use client";

import * as Ably from "ably";
import ChatBox from "./chat-box.jsx";

export default function Chat() {
  const client = new Ably.Realtime({
    key: "jkgk1g.MRf7Ng:FbZCsh1NmuGUhs-1-edrz1NANJdpTnZdXC6AD1B-YWU",
  });
  return <ChatBox />;
}
