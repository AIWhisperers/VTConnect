/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/conversation_config.js';
import { dateToId, idToDate } from '../utils/dateToId.js';

import { X, Zap } from 'react-feather';
import { Button } from '../components/button/Button';

import './ConsolePage.scss';
import { useContract } from '../contractContext';

const LOCAL_RELAY_SERVER_URL: string =
  process.env.NEXT_PUBLIC_REACT_APP_LOCAL_RELAY_SERVER_URL || '';

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

export function ConsolePage() {
  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey = LOCAL_RELAY_SERVER_URL
    ? ''
    : localStorage.getItem('tmp::voice_api_key') ||
      prompt('OpenAI API Key') ||
      '';
  if (apiKey !== '') {
    localStorage.setItem('tmp::voice_api_key', apiKey);
  }
  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      LOCAL_RELAY_SERVER_URL
        ? { url: LOCAL_RELAY_SERVER_URL }
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { available, mint } = useContract();
  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // Set state variables
    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems());

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Connect to realtime API
    await client.connect();
    client.sendUserMessageContent([
      {
        type: `input_text`,
      text: `Hello!`,
        
      },
    ]);

    if (client.getTurnDetectionType() === 'server_vad') {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  }, []);

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setRealtimeEvents([]);
    setItems([]);

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    if (value === 'none' && wavRecorder.getStatus() === 'recording') {
      await wavRecorder.pause();
    }
    client.updateSession({
      turn_detection: value === 'none' ? null : {
        "type": "server_vad",
        "threshold": 0.9,
        "prefix_padding_ms": 1000,
        "silence_duration_ms": 500
    }});
    if (value === 'server_vad' && client.isConnected()) {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  };

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const scrollToBottom = () => {
      const conversationEl = document.querySelector('[data-conversation-content]') as HTMLDivElement;
      if (!conversationEl) return;
      
      // Force scroll to bottom
      conversationEl.scrollTop = conversationEl.scrollHeight;
    };

    // Scroll immediately
    scrollToBottom();

    // Scroll after content updates (multiple attempts to handle dynamic content)
    const timeouts = [50, 150, 300].map(delay => 
      setTimeout(scrollToBottom, delay)
    );

    // Cleanup timeouts
    return () => timeouts.forEach(timeout => clearTimeout(timeout));
  }, [items]);
  // const checkAvailability = useCallback(, [available])
  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ instructions: instructions, voice: 'shimmer' });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    client.addTool(
      {
        name: 'check_availability',
        description:
          'Check the availability of rooms in a hotel at specific dates and return a list of unavailable days',
        parameters: {
          type: 'object',
          properties: {
            checkin: { type: 'string', format: 'date' },
            checkout: { type: 'string', format: 'date' },
          },
        },
      },
      async ({checkin,  checkout}: {checkin: string, checkout: string}) => {
        console.log('check_availability', checkin, checkout);
        const checkin_date = new Date(`${checkin}`);
        const checkout_date = new Date(`${checkout}`);
        console.log('check_availability', `${checkin}`, checkin_date, checkout_date, dateToId(checkin_date), dateToId(checkout_date));
    
        let notAvailable = [];
        for (let i = dateToId(checkin_date); i < dateToId(checkout_date); i++) {
          console.log('i', i);
          let dayAvailable = await available(BigInt(i));
          console.log('i, available', i , dayAvailable);
          if (!dayAvailable || ((i%3) === 0)) {
            notAvailable.push(i);
          }
        }
        console.log('notAvailable', notAvailable);
        const ret = {
          availability: notAvailable.length ? 'not available' : 'available',
          daysNotAvailable: notAvailable.map(idToDate),
        };
        console.log('ret', ret);
        return ret;
      }
    );
    client.addTool(
      {
        name: 'reserve_room',
        description:
          'Reserve a room in a hotel at specific dates',
        parameters: {
          type: 'object',
          properties: {
            checkin: { type: 'string', format: 'date' },
            checkout: { type: 'string', format: 'date' },
          },
        },
      },
      async ({checkin,  checkout}: {checkin: string, checkout: string}) => {
        const checkin_date = new Date(`${checkin}`);
        const checkout_date = new Date(`${checkout}`);
        for (let i = dateToId(checkin_date); i < dateToId(checkout_date); i++) {
          mint(BigInt(i));
        }
      }
    );
    // handle realtime events from client + server for event logging
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // if we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });
    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, [available]);

  /**
   * Render the application
   */
  return (
    <div data-component="ConsolePage">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body overflow-y-auto max-h-[calc(100vh-200px)]" data-conversation-content>
            {!items.length && (
              <div className="empty-state text-center">
                <h3 className="text-2xl font-bold text-black">Welcome to the Blockchain Hotel</h3>
                <p>Your Voice Assistant in the World of Blockchain</p>
              </div>
            )}
            {items.map((conversationItem, i) => {
              return (
                <div className="conversation-item" key={conversationItem.id}>
                  <div className={`badge ${conversationItem.role || ''}`}>
                    <div>
                      {(conversationItem.role || conversationItem.type).replaceAll('_', ' ')}
                    </div>
                  </div>
                  <div className="badge-content">
                    {!conversationItem.formatted.tool && conversationItem.role === 'user' && (
                      <div>
                        {conversationItem.formatted.transcript ||
                          (conversationItem.formatted.audio?.length
                            ? '(awaiting transcript)'
                            : conversationItem.formatted.text || '(item sent)')}
                      </div>
                    )}
                    {!conversationItem.formatted.tool && conversationItem.role === 'assistant' && (
                      <div>
                        {conversationItem.formatted.transcript ||
                          conversationItem.formatted.text || '(truncated)'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card-actions justify-center">
            {!isConnected ? (
              <Button
                label="Talk to Blockie"
                icon={Zap}
                buttonStyle="action"
                onClick={() => {
                  connectConversation();
                  changeTurnEndType('server_vad');
                }}
                className="btn btn-primary w-full max-w-xs"
              />
            ) : (
              <Button
                label="End Conversation"
                icon={X}
                buttonStyle="action"
                onClick={disconnectConversation}
                className="btn btn-secondary w-full max-w-xs"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

