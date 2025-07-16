import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, Send, Download, MapPin, Star, Users, Wifi } from 'lucide-react';
import tunisiaHero from '@/assets/tunisia-hero.jpg';
import microphoneIcon from '@/assets/microphone-icon.png';

interface ApiResponse {
  text: string;
  audio_base64: string;
}

const TunisiaHotelAdvisor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const sampleQueries = [
    "What are the best 4-star hotels in Sousse for a family with beach access?",
    "Recommend luxury 5-star resorts in Djerba with spa facilities",
    "Budget-friendly 3-star hotels in Hammamet with pools and kids activities",
    "All-inclusive hotels in Mahdia for couples with private beach"
  ];

  const handleSubmit = async () => {
    if (!query.trim()) {
      toast({
        title: "يرجى إدخال استفسارك",
        description: "Please enter your hotel query first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: ApiResponse = await response.json();
      setResponse(data);
      
      toast({
        title: "تم الحصول على التوصيات",
        description: "Hotel recommendations received successfully!",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "ميزة التعرف على الصوت غير متاحة",
        description: "Voice recognition is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "🎤 الاستماع...",
        description: "Speak now to ask about Tunisian hotels"
      });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "خطأ في التعرف على الصوت",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const downloadAudio = () => {
    if (response?.audio_base64) {
      // Convert base64 to blob and create download URL
      const audioData = response.audio_base64.includes('data:audio') 
        ? response.audio_base64 
        : `data:audio/mp3;base64,${response.audio_base64}`;
      
      const link = document.createElement('a');
      link.href = audioData;
      link.download = 'tunisia-hotel-recommendation.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم تحميل الملف الصوتي",
        description: "Audio file downloaded successfully!"
      });
    }
  };

  function formatHotelResponse(text: string) {
    // 1. Remplace les doubles retours à la ligne (vrais ou échappés) par des paragraphes
    let formatted = text.replace(/(\\n\\n|\n\n)/g, '</p><p>');
    // 2. Remplace les simples retours à la ligne (vrais ou échappés) par <br/>
    formatted = formatted.replace(/(\\n|\n)/g, '<br/>');

    // 3. (Optionnel) Mets en valeur les noms d’hôtels connus
    const hotels = [
      "Hasdrubal Thalassa & Spa Mahdia",
      "Iberostar Averroes",
      "Iberostar Selection Eolia Djerba",
      "Fiesta Beach Djerba",
      "Iberostar Waves Mehari Djerba",
      "Iberostar Selection Diar El Andalous",
      "The Residence Tunis",
      "Medina Solaria & Thalasso"
    ];
    
    hotels.forEach(hotel => {
      const regex = new RegExp(hotel, 'g');
      formatted = formatted.replace(
        regex,
        `<span style="color: #e25822; font-weight: bold;">${hotel}</span>`
      );
    });

    // 4. Ajoute le premier <p> si besoin
    formatted = `<p>${formatted}</p>`;

    return formatted;
  }

  return (
    <div className="min-h-screen bg-gradient-sand">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={tunisiaHero} 
          alt="Tunisia Tourism" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-tunisia-blue/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={microphoneIcon} alt="Voice" className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">
                🎙️ مساعدك لفنادق تونس
              </h1>
            </div>
            <p className="text-xl md:text-2xl opacity-90">
              Your Tunisian Hotel Advisor - خبير الفنادق التونسية
            </p>
            <p className="text-lg opacity-80 mt-2">
              Discover the best hotels across Tunisia with personalized recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 -mt-20 relative z-10">
        {/* Query Input Section */}
        <Card className="mb-8 shadow-card bg-card/95 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground flex items-center justify-center gap-2">
              <MapPin className="text-tunisia-terracotta" />
              أسأل عن فنادق تونس - Ask About Tunisian Hotels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are the best 4-star hotels in Sousse for a family with beach access?"
                className="flex-1 px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Sample Queries */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">جرب هذه الأسئلة - Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(sample)}
                    className="text-xs"
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Section */}
        {response && (
          <Card className="shadow-card bg-card border-primary/20 animate-fade-in">
            <CardHeader className="bg-gradient-warm text-primary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Star className="text-yellow-300" />
                  The Response Is Ready !! 
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: formatHotelResponse(response.text) }}
              />

              {/* Audio Player */}
              {response.audio_base64 && (
                <div className="mt-6 p-4 bg-accent/50 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-mediterranean rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                       <span className="text-sm font-medium text-foreground">
                         Listen by the response instead of reading it
                       </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAudio}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      تحميل
                    </Button>
                  </div>
                  <audio
                    ref={audioRef}
                    controls
                    className="w-full mt-3"
                    src={response.audio_base64.includes('data:audio') 
                      ? response.audio_base64 
                      : `data:audio/mp3;base64,${response.audio_base64}`}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Hotel Features Icons */}
              <div className="mt-6 flex justify-center gap-6 text-tunisia-terracotta">
                <div className="flex flex-col items-center gap-1">
                  <MapPin className="w-6 h-6" />
                  <span className="text-xs text-muted-foreground">Locations</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Star className="w-6 h-6" />
                  <span className="text-xs text-muted-foreground">Ratings</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Users className="w-6 h-6" />
                  <span className="text-xs text-muted-foreground">Family</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Wifi className="w-6 h-6" />
                  <span className="text-xs text-muted-foreground">Amenities</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-muted-foreground bg-card/50">
        <p className="text-sm">
          🇹🇳 Powered by Tunisia Travel Intelligence | مدعوم من الذكاء السياحي التونسي
        </p>
      </footer>
    </div>
  );
};

export default TunisiaHotelAdvisor;