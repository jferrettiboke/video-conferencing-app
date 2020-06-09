import Head from "next/head";

export default function Home() {
  const [peer, setPeer] = React.useState(null);
  const [localId, setLocalId] = React.useState("");
  const [remoteId, setRemoteId] = React.useState("");
  const [error, setError] = React.useState(null);
  const remoteVideoRef = React.useRef(null);
  const localVideoRef = React.useRef(null);

  const buttonIsDisabled = remoteId === "";

  async function call() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if ("srcObject" in localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      } else {
        // Avoid using this in new browsers, as it is going away.
        localVideoRef.current.src = URL.createObjectURL(mediaStream);
      }

      const conn = peer.connect(remoteId);
      const call = peer.call(remoteId, mediaStream);

      conn.on("open", function () {
        conn.send(localId);
      });

      call.on("stream", function (remoteStream) {
        if ("srcObject" in remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        } else {
          // Avoid using this in new browsers, as it is going away.
          remoteVideoRef.current.src = URL.createObjectURL(remoteStream);
        }
      });
    } catch (error) {
      console.log("Failed to get local stream", error);
    }
  }

  React.useEffect(() => {
    if (peer) return;

    let _peer = new Peer();

    _peer.on("open", function (id) {
      console.log(`My peer ID is: ${id}`);
      setPeer(_peer);
      setLocalId(id);
    });
  });

  React.useEffect(() => {
    if (!peer) return;

    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    peer.on("call", async function (call) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if ("srcObject" in localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        } else {
          // Avoid using this in new browsers, as it is going away.
          localVideoRef.current.src = URL.createObjectURL(mediaStream);
        }

        // Answer the call with an A/V stream.
        call.answer(mediaStream);

        call.on("stream", function (remoteStream) {
          if ("srcObject" in remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          } else {
            // Avoid using this in new browsers, as it is going away.
            remoteVideoRef.current.src = URL.createObjectURL(remoteStream);
          }
        });
      } catch (error) {
        console.log("Failed to get local stream", error);
      }
    });

    peer.on("connection", function (conn) {
      console.log("Connected");

      conn.on("data", function (emisorID) {
        console.log(emisorID);
      });
    });

    peer.on("error", function (err) {
      setError(err.message);
    });
  }, [peer, localVideoRef, remoteVideoRef]);

  return (
    <>
      <Head>
        <link
          href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css"
          rel="stylesheet"
        />
        <script src="https://unpkg.com/peerjs@1.2.0/dist/peerjs.min.js"></script>
      </Head>
      <main className="container mx-auto px-5 flex flex-col items-center my-20">
        <h1 className="font-bold text-2xl mb-10">Video conferencing app</h1>

        <p className="mb-5">
          Your peer ID: <b>{localId ? localId : "Loading..."}</b>
        </p>

        <div className="mb-5">
          <input
            className="border py-2 px-4 rounded mr-1"
            type="text"
            onChange={(e) => setRemoteId(e.target.value)}
            placeholder="Friend's peer ID"
          />
          <button
            className={[
              "bg-black text-white py-2 px-4 rounded font-bold",
              buttonIsDisabled && "opacity-25",
            ].join(" ")}
            disabled={buttonIsDisabled}
            onClick={call}
          >
            Call
          </button>
        </div>

        <p className="text-red-500 mb-20 text-center">{error && error}</p>

        <div className="grid grid-cols-2 gap-1">
          <video
            ref={remoteVideoRef}
            className="border"
            volume="true"
            autoPlay
          ></video>
          <video ref={localVideoRef} className="border" autoPlay muted></video>
        </div>
      </main>
    </>
  );
}
