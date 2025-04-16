import useInterval from "@/hooks/useInterval";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
  useOthers,
} from "@liveblocks/react";
import React, { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import LiveCursors from "./cursor/LiveCursors";
import FlyingReaction from "./reaction/FlyingReaction";
import ReactionSelector from "./reaction/ReactionButton";

const Live = () => {
  const others = useOthers();
  const [{ cursor }, updateMyPresence] = useMyPresence();

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });

  const [reaction, setReaction] = useState<Reaction[]>([]);

  const broadcast = useBroadcastEvent();

  // remove reaction element after 4 seconds
  useInterval(() => {
    setReaction((reactions) =>
      reactions.filter((item) => item.timestamp > Date.now() - 4000)
    );
  }, 1000);

  // show reaction element when user is pressing the reaction button in every 100ms
  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursor
    ) {
      setReaction((reactions) =>
        reactions.concat([
          {
            point: {
              x: cursor.x,
              y: cursor.y,
            },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );

      // broadcast reaction event to other users
      // this will be used to show the reaction element in other users' screen
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      });
    }
  }, 100);

  // listen for reaction event from other users
  useEventListener((eventData) => {
    const { x, y, value } = eventData.event as ReactionEvent;

    setReaction((reactions) =>
      reactions.concat([
        {
          point: {
            x,
            y,
          },
          value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  // listen for cursor event from other users
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();

    if (cursor === null || cursorState.mode === CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
    }
  }, []);

  // hide cursor when pointer leaves the screen
  const handlePointerLeave = useCallback(() => {
    setCursorState({ mode: CursorMode.Hidden });

    updateMyPresence({ cursor: null, message: null });
  }, []);

  // show cursor when pointer is down
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });

      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  // show cursor when pointer is up
  const handlePointerUp = useCallback(() => {
    setCursorState((state: CursorState) =>
      cursorState.mode === CursorMode.Reaction
        ? { ...state, isPressed: true }
        : state
    );
  }, [cursorState.mode, setCursorState]);

  // show chat input when user presses "/" key
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
      } else if (e.key === "Escape") {
        updateMyPresence({
          message: "",
        });

        setCursorState({
          mode: CursorMode.Hidden,
        });
      } else if (e.key === "e") {
        setCursorState({
          mode: CursorMode.ReactionSelector,
        });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  // set reaction when user clicks on the reaction button
  const setReactions = useCallback((reaction: string) => {
    setCursorState({
      mode: CursorMode.Reaction,
      reaction,
      isPressed: false,
    });
  }, []);
  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="h-screen w-full flex items-center justify-center text-center"
    >
      <h1 className="text-white text-2xl">Liveblocks Figma Clone</h1>

      {reaction.map((item) => (
        <FlyingReaction
          value={item.value}
          key={item.timestamp.toString()}
          x={item.point.x}
          y={item.point.y}
          timestamp={item.timestamp}
        />
      ))}

      {cursor && (
        <CursorChat
          cursor={cursor}
          cursorState={cursorState}
          setCursorState={setCursorState}
          updateMyPresence={updateMyPresence}
        />
      )}

      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector setReaction={setReactions} />
      )}

      <LiveCursors others={others} />
    </div>
  );
};

export default Live;
