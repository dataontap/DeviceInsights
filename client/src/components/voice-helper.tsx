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
  
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const { toast } = useToast();

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

  // Generate voice conversation
  const conversationMutation = useMutation({
    mutationFn: async ({ text, voiceCount, location, language }: {
      text: string;
      voiceCount: number;
      location: any;
      language: string;
    }) => {
      const response = await apiRequest('POST', '/api/voice/multi-conversation', {
        text,
        voiceCount,
        location,
        language
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.conversation) {
        setConversation(data.conversation);
        // Prepare audio elements
        audioRefs.current = data.conversation.map((item: ConversationItem) => {
          const audio = new Audio(`data:audio/mpeg;base64,${item.audio}`);
          audio.volume = volume[0];
          return audio;
        });
        setCurrentTrackIndex(0);
        toast({
          title: "Voice Guide Ready",
          description: `Generated ${data.voiceCount}-voice conversation for IMEI help${data.isHarmonizing ? ' with harmonizing' : ''}${data.isSinging ? ' in Canadian rock style' : ''}!`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Generation Failed",
        description: "Unable to generate voice assistance. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Generate USSD help specifically
  const ussdHelpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/voice/ussd-help', {
        language: selectedLanguage,
        location
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Create single audio item for USSD help
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audio.volume = volume[0];
        audioRefs.current = [audio];
        
        setConversation([{
          index: 0,
          audio: data.audio,
          message: {
            text: data.text,
            voiceConfig: data.voice
          }
        }]);
        
        setCurrentTrackIndex(0);
        toast({
          title: "USSD Voice Guide Ready",
          description: "AI assistant ready to help you find your IMEI number!",
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

  const playPause = () => {
    const currentAudio = audioRefs.current[currentTrackIndex];
    if (!currentAudio) return;

    if (isPlaying) {
      currentAudio.pause();
      setIsPlaying(false);
    } else {
      currentAudio.play();
      setIsPlaying(true);
      
      // Handle audio end
      currentAudio.onended = () => {
        if (currentTrackIndex < conversation.length - 1) {
          setCurrentTrackIndex(currentTrackIndex + 1);
        } else {
          setIsPlaying(false);
        }
      };
    }
  };

  const skipForward = () => {
    if (currentTrackIndex < conversation.length - 1) {
      audioRefs.current[currentTrackIndex]?.pause();
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(false);
    }
  };

  const skipBack = () => {
    if (currentTrackIndex > 0) {
      audioRefs.current[currentTrackIndex]?.pause();
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    audioRefs.current.forEach(audio => {
      if (audio) audio.volume = newVolume[0];
    });
  };

  const generateConversation = () => {
    const text = "Help me find my IMEI number using USSD codes";
    conversationMutation.mutate({
      text,
      voiceCount,
      location,
      language: selectedLanguage
    });
  };

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
            ElevenLabs Voice Assistant
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
                <Label htmlFor="voices" data-testid="label-voice-count">Voices ({voiceCount})</Label>
                <Select value={voiceCount.toString()} onValueChange={(value) => setVoiceCount(parseInt(value))}>
                  <SelectTrigger data-testid="select-voice-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" data-testid="option-voice-1">1 Voice - Standard</SelectItem>
                    <SelectItem value="2" data-testid="option-voice-2">2 Voices - Q&A</SelectItem>
                    <SelectItem value="3" data-testid="option-voice-3">3 Voices - Panel</SelectItem>
                    <SelectItem value="4" data-testid="option-voice-4">4 Voices - Harmonizing <Music className="inline w-4 h-4 ml-1" /></SelectItem>
                    <SelectItem value="5" data-testid="option-voice-5">5 Voices - Canadian Rock <Music className="inline w-4 h-4 ml-1" /></SelectItem>
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

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              onClick={generateUSSDHelp}
              disabled={ussdHelpMutation.isPending}
              className="w-full"
              data-testid="button-generate-ussd-help"
            >
              {ussdHelpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate USSD Help ({selectedLanguage.toUpperCase()})
            </Button>
            
            <Button 
              onClick={generateConversation}
              disabled={conversationMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-generate-conversation"
            >
              {conversationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Users className="w-4 h-4 mr-2" />
              Generate {voiceCount}-Voice Conversation
            </Button>
          </div>

          {/* Playback Controls */}
          {conversation.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">
                Now Playing ({currentTrackIndex + 1}/{conversation.length}):
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