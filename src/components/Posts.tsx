import { KeyboardEvent, FormEvent, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAPI } from "../lib/api";
import { trimmedPost } from "../lib/reply";
import { useShallow } from "zustand/react/shallow";
import { Textarea } from "./Input";
import { Post } from "./Post";

type Reply = {
  id: string;
  content: string;
  username: string;
};

export type PostsProps = {
  chat: string;
};
export const Posts = (props: PostsProps) => {
  const [reply, setReply] = useState<Reply>();
  const [home, loadChatPosts] = useAPI(
    useShallow((state) => [state.chatPosts[props.chat], state.loadChatPosts]),
  );
  loadChatPosts(props.chat);

  if (!home) {
    return <>Loading posts...</>;
  }
  if (home.error) {
    return (
      <div>
        <p className="font-bold">There was an error loading posts.</p>
        <p>{home.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <EnterPost
        chat={props.chat}
        reply={reply}
        onPosted={() => setReply(undefined)}
      />
      {home.posts.map((post) => (
        <Post
          key={post}
          id={post}
          onReply={(id, content, username) =>
            setReply({ id, content, username })
          }
        />
      ))}
    </div>
  );
};

export type EnterPostProps = {
  chat: string;
  reply?: Reply | undefined;
  onPosted?: () => void;
};
const EnterPost = (props: EnterPostProps) => {
  const [post, credentials] = useAPI(
    useShallow((state) => [state.post, state.credentials]),
  );
  const [postContent, setPostContent] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  if (!credentials) {
    return <></>;
  }

  const handlePost = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setPosting(true);
    const response = await post(
      (props.reply
        ? `@${props.reply.username} ${trimmedPost(props.reply.content)} (${props.reply.id})\n`
        : "") + postContent,
      props.chat,
    );
    if (response.error) {
      setError(response.message);
    }
    setPosting(false);
    setPostContent("");
    props.onPosted?.();
  };

  const handleInput = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <form onSubmit={handlePost} className={twMerge("w-full")}>
      <Textarea
        value={postContent}
        onChange={(e) => setPostContent(e.currentTarget.value)}
        onKeyDown={handleInput}
        disabled={posting}
        after={
          <>
            <button type="submit" aria-label="Send" disabled={posting}>
              <SendHorizontal aria-hidden />
            </button>
          </>
        }
        above={props.reply ? <Post id={props.reply.id} reply /> : undefined}
      />
      {error ? <span className="text-red-500">{error}</span> : undefined}
    </form>
  );
};
