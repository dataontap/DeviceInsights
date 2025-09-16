import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, Volume2, SkipBack, SkipForward, Globe, Users, Music, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceHelperProps {
  trigger?: React.ReactNode;
}

interface VoiceConfig {
  voiceId: string;
  name: string;
  personality: string;
}

interface ConversationItem {
  index: number;
  audio: string;
  message: {
    text: string;
    voiceConfig: VoiceConfig;
    isHarmonizing?: boolean;
    isSinging?: boolean;
  };
}

export default function VoiceHelper({ trigger }: VoiceHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState([0.7]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [voiceCount, setVoiceCount] = useState(1);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [location, setLocation] = useState<{city?: string; country?: string} | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const currentRequestVersion = useRef(0);
  
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const savedPlaybackPosition = useRef<number>(0); // Store playback position for resuming
  const { toast } = useToast();

  // Helper to stop current playback cleanly while preserving position
  const stopCurrentPlayback = () => {
    const currentAudio = audioRefs.current[currentTrackIndex];
    if (currentAudio && !currentAudio.paused) {
      // Save current playback position before stopping
      savedPlaybackPosition.current = currentAudio.currentTime;
      console.log('Saved playback position:', savedPlaybackPosition.current);
    }
    
    audioRefs.current.forEach(a => {
      if (a) {
        try {
          a.pause();
          a.onended = null;
          // Don't reset currentTime - let the new audio decide the position
        } catch {}
      }
    });
    setIsPlaying(false);
  };

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get location name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            setLocation({
              city: data.city || data.locality,
              country: data.countryName
            });
          } catch (error) {
            console.error('Failed to get location details:', error);
            setLocation({ city: 'your location', country: 'your area' });
          }
        },
        () => {
          // Fallback if geolocation fails
          setLocation({ city: 'your location', country: 'your area' });
        }
      );
    }
  }, []);

  // Fetch available languages
  const { data: languagesData } = useQuery({
    queryKey: ['/api/voice/languages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/voice/languages');
      return response.json();
    },
    enabled: isOpen
  });

  // Fetch voice agents for selected language
  const { data: voiceAgentsData } = useQuery({
    queryKey: ['/api/voice/agents', selectedLanguage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/voice/agents?language=${selectedLanguage}`);
      return response.json();
    },
    enabled: isOpen && !!selectedLanguage
  });


  // Generate USSD help specifically
  const ussdHelpMutation = useMutation({
    mutationFn: async () => {
      // Increment request version to prevent race conditions
      currentRequestVersion.current += 1;
      const thisRequestVersion = currentRequestVersion.current;
      
      const response = await apiRequest('POST', '/api/voice/ussd-help', {
        language: selectedLanguage,
        location,
        voiceCount, // Include voice count for special prompts
        requestVersion: thisRequestVersion
      });
      const data = await response.json();
      return { ...data, requestVersion: thisRequestVersion };
    },
    onSuccess: (data) => {
      // Check if this response is still current (prevent race conditions)
      if (data.requestVersion && data.requestVersion < currentRequestVersion.current) {
        console.log('Ignoring stale response:', data.requestVersion, 'current:', currentRequestVersion.current);
        return;
      }
      
      if (data.success) {
        // Always stop current audio first to prevent overlaps
        stopCurrentPlayback();
        
        // Handle different responses for single vs multi-voice
        if (data.conversation) {
          // Multi-voice response (harmonizing/singing)
          const newAudioRefs = data.conversation.map((item: ConversationItem) => {
            const audio = new Audio(`data:audio/mpeg;base64,${item.audio}`);
            audio.volume = volume[0];
            return audio;
          });
          
          // Set up auto-advance handlers for all tracks
          newAudioRefs.forEach((audio: HTMLAudioElement | null, index: number) => {
            if (audio) {
              audio.onended = () => {
                if (index < newAudioRefs.length - 1) {
                  // Auto-advance to next track
                  setCurrentTrackIndex(index + 1);
                  setTimeout(() => {
                    const nextAudio = newAudioRefs[index + 1];
                    if (nextAudio) {
                      nextAudio.volume = volume[0];
                      nextAudio.play();
                      setIsPlaying(true);
                    }
                  }, 100);
                } else {
                  // End of playlist
                  setIsPlaying(false);
                }
              };
            }
          });
          
          // Replace audio refs and start playing
          audioRefs.current = newAudioRefs;
          setConversation(data.conversation);
          setCurrentTrackIndex(0);
          
          // Force UI update to show new track count immediately
          setTimeout(() => setCurrentTrackIndex(0), 0);
          
          setTimeout(() => {
            if (newAudioRefs[0]) {
              // Resume from saved position if available and valid
              if (savedPlaybackPosition.current > 0 && savedPlaybackPosition.current < newAudioRefs[0].duration) {
                console.log('Resuming from position:', savedPlaybackPosition.current);
                newAudioRefs[0].currentTime = savedPlaybackPosition.current;
              }
              newAudioRefs[0].play();
              setIsPlaying(true);
            }
          }, 100);
          
        } else {
          // Single voice response
          const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
          audio.volume = volume[0];
          
          // Single voice doesn't need auto-advance onended handler
          audio.onended = () => {
            setIsPlaying(false);
          };
          
          // Replace audio refs and start playing
          audioRefs.current = [audio];
          setConversation([{
            index: 0,
            audio: data.audio,
            message: { text: data.text, voiceConfig: data.voice }
          }]);
          setCurrentTrackIndex(0);
          
          // Force UI update to show new track count immediately  
          setTimeout(() => setCurrentTrackIndex(0), 0);
          
          setTimeout(() => {
            // Resume from saved position if available and valid
            if (savedPlaybackPosition.current > 0 && savedPlaybackPosition.current < audio.duration) {
              console.log('Resuming single audio from position:', savedPlaybackPosition.current);
              audio.currentTime = savedPlaybackPosition.current;
            }
            audio.play();
            setIsPlaying(true);
          }, 100);
        }
        
        toast({
          title: "USSD Voice Guide Ready",
          description: voiceCount >= 4 ? 
            (voiceCount === 5 ? "Christmas song about first phones!" : "Harmonizing voice assistance!") :
            "AI assistant ready to help you find your IMEI number!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Help Failed", 
        description: "Unable to generate USSD voice instructions. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto-advance to next track
  const playNextTrack = () => {
    if (currentTrackIndex < conversation.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      
      setTimeout(() => {
        const nextAudio = audioRefs.current[nextIndex];
        if (nextAudio) {
          nextAudio.volume = volume[0];
          nextAudio.play();
          setIsPlaying(true);
          
          // Set onended handler for the new track
          nextAudio.onended = () => {
            playNextTrack();
          };
        }
      }, 100);
    } else {
      // End of playlist
      setIsPlaying(false);
    }
  };

  const playPause = () => {
    const currentAudio = audioRefs.current[currentTrackIndex];
    if (!currentAudio) return;

    if (isPlaying) {
      currentAudio.pause();
      setIsPlaying(false);
    } else {
      currentAudio.volume = volume[0];
      currentAudio.play();
      setIsPlaying(true);
      
      // Set onended handler for auto-advance (only if not already set)
      if (!currentAudio.onended) {
        currentAudio.onended = () => {
          playNextTrack();
        };
      }
    }
  };

  const skipForward = () => {
    if (currentTrackIndex < conversation.length - 1) {
      audioRefs.current[currentTrackIndex]?.pause();
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(false);
      
      // Auto-play next track
      setTimeout(() => {
        const nextAudio = audioRefs.current[nextIndex];
        if (nextAudio) {
          nextAudio.volume = volume[0];
          nextAudio.play();
          setIsPlaying(true);
          
          // Set onended handler for auto-advance
          nextAudio.onended = () => {
            playNextTrack();
          };
        }
      }, 100);
    }
  };

  const skipBack = () => {
    if (currentTrackIndex > 0) {
      audioRefs.current[currentTrackIndex]?.pause();
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setIsPlaying(false);
      
      // Auto-play previous track
      setTimeout(() => {
        const prevAudio = audioRefs.current[prevIndex];
        if (prevAudio) {
          prevAudio.volume = volume[0];
          prevAudio.play();
          setIsPlaying(true);
          
          // Set onended handler for auto-advance
          prevAudio.onended = () => {
            playNextTrack();
          };
        }
      }, 100);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    audioRefs.current.forEach(audio => {
      if (audio) audio.volume = newVolume[0];
    });
  };

  // Auto-generate and play when dialog opens
  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      // Initial load - auto-generate EN Standard voice
      generateUSSDHelp();
    }
  }, [isOpen]);

  // Real-time language switching
  useEffect(() => {
    if (selectedLanguage && isOpen && conversation.length > 0) {
      ussdHelpMutation.mutate();
    }
  }, [selectedLanguage]);

  // Real-time voice style switching
  useEffect(() => {
    if (voiceCount && isOpen && conversation.length > 0) {
      ussdHelpMutation.mutate();
    }
  }, [voiceCount]);

  const generateUSSDHelp = () => {
    ussdHelpMutation.mutate();
  };

  const currentMessage = conversation[currentTrackIndex]?.message;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="link"
            className="p-0 h-auto text-blue-600 hover:text-blue-800 underline"
            data-testid="link-voice-help"
          >
            (Get AI to Help)
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md" data-testid="dialog-voice-helper">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            AI Voice Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Voice Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language" data-testid="label-language">Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languagesData?.languages && Object.entries(languagesData.languages).map(([code, info]: [string, any]) => (
                      <SelectItem key={code} value={code} data-testid={`option-lang-${code}`}>
                        {info.flag} {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="voices" data-testid="label-voice-style">Voice Style</Label>
                <Select value={voiceCount.toString()} onValueChange={(value) => setVoiceCount(parseInt(value))}>
                  <SelectTrigger data-testid="select-voice-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" data-testid="option-voice-1">Standard Voice</SelectItem>
                    <SelectItem value="4" data-testid="option-voice-4">Harmonizing Style <Music className="inline w-4 h-4 ml-1" /></SelectItem>
                    <SelectItem value="5" data-testid="option-voice-5">Canadian Rock Style <Music className="inline w-4 h-4 ml-1" /></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {voiceCount >= 4 && (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <Music className="inline w-4 h-4 mr-1" />
                {voiceCount === 4 ? 'Voices will harmonize while explaining IMEI discovery' : 'Voices will sing in Canadian rock style with Christmas ballad harmonies!'}
              </div>
            )}
          </div>

          {/* USSD Help Action */}
          <div className="space-y-2">
            <Button 
              onClick={generateUSSDHelp}
              disabled={ussdHelpMutation.isPending}
              className="w-full"
              data-testid="button-generate-ussd-help"
            >
              {ussdHelpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ussdHelpMutation.isPending ? `Loading ${selectedLanguage.toUpperCase()}...` : `Generate USSD Help (${selectedLanguage.toUpperCase()})`}
            </Button>
            
          </div>

          {/* Playback Controls */}
          {conversation.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">
                Now Playing ({currentTrackIndex + 1}/{conversation.length})
                {ussdHelpMutation.isPending && <span className="text-blue-600 ml-2">🔄 Loading new audio...</span>}:
              </div>
              
              {currentMessage && (
                <div className="text-sm text-gray-600 bg-white p-2 rounded">
                  <strong>{currentMessage.voiceConfig.personality}:</strong>
                  <br />
                  {currentMessage.text}
                  {currentMessage.isHarmonizing && <span className="ml-2 text-amber-500">🎵 Harmonizing</span>}
                  {currentMessage.isSinging && <span className="ml-2 text-red-500">🎸 Rock Style</span>}
                </div>
              )}
              
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipBack}
                  disabled={currentTrackIndex === 0}
                  data-testid="button-skip-back"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={playPause}
                  size="sm"
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipForward}
                  disabled={currentTrackIndex === conversation.length - 1}
                  data-testid="button-skip-forward"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="flex-1"
                    data-testid="slider-volume"
                  />
                </div>
              </div>
            </div>
          )}
          
          {location && (
            <div className="text-xs text-gray-500 text-center">
              <Globe className="inline w-3 h-3 mr-1" />
              Speaking from {location.city}, {location.country} on {new Date().toLocaleDateString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}