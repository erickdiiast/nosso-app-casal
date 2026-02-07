import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Gift, 
  Check, 
  X, 
  Clock, 
  Sparkles,
  Camera,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/hooks/useApp';
import type { Reward } from '@/types';

export function RewardsSection() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { 
    currentUser, 
    rewards, 
    approveReward, 
    rejectReward,
    getApprovedRewards,
    getPendingRewards 
  } = useApp();

  const approvedRewards = getApprovedRewards();
  const pendingRewards = getPendingRewards();
  const myPendingRewards = rewards.filter(
    r => r.status === 'pending' && r.suggestedBy === currentUser?.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Recompensas</h2>
          <p className="text-gray-500">Sugiram recompensas especiais 🎁</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-love gradient-love text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Sugerir
        </Button>
      </div>

      {/* Pending approval from partner */}
      {pendingRewards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Aguardando sua aprovação
            <span className="text-sm font-normal text-gray-500">({pendingRewards.length})</span>
          </h3>
          
          {pendingRewards.map((reward) => (
            <PendingRewardCard
              key={reward.id}
              reward={reward}
              onApprove={() => approveReward(reward.id)}
              onReject={() => rejectReward(reward.id)}
            />
          ))}
        </motion.div>
      )}

      {/* My pending suggestions */}
      {myPendingRewards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Suas sugestões pendentes
            <span className="text-sm font-normal text-gray-500">({myPendingRewards.length})</span>
          </h3>
          
          {myPendingRewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} isPending />
          ))}
        </motion.div>
      )}

      {/* Approved rewards */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          Recompensas aprovadas
          <span className="text-sm font-normal text-gray-500">({approvedRewards.length})</span>
        </h3>
        
        {approvedRewards.length === 0 ? (
          <div className="card-love p-8 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma recompensa aprovada ainda</p>
            <p className="text-sm text-gray-400 mt-1">Sugira uma recompensa para seu parceiro!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvedRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </div>

      {/* Create Reward Modal */}
      <CreateRewardModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}

// Pending Reward Card (for approval)
function PendingRewardCard({ 
  reward, 
  onApprove, 
  onReject 
}: { 
  reward: Reward; 
  onApprove: () => void;
  onReject: () => void;
}) {
  const { currentUser } = useApp();
  const isMySuggestion = reward.suggestedBy === currentUser?.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card-love p-4 border-2 border-yellow-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center flex-shrink-0">
          <Gift className="w-7 h-7 text-yellow-600" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">{reward.title}</h4>
          {reward.description && (
            <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-points">
              <Sparkles className="w-3 h-3" />
              {reward.points}
            </span>
            <span className="text-xs text-gray-400">
              Sugerido por {isMySuggestion ? 'você' : 'seu parceiro'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            onClick={onApprove}
            className="rounded-full bg-green-500 hover:bg-green-600 text-white"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onReject}
            className="rounded-full text-red-500 hover:bg-red-50"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {reward.image && (
        <img 
          src={reward.image} 
          alt={reward.title}
          className="mt-3 w-full h-32 object-cover rounded-xl"
        />
      )}
    </motion.div>
  );
}

// Reward Card
function RewardCard({ reward, isPending = false }: { reward: Reward; isPending?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-love p-4 ${isPending ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isPending ? 'bg-blue-100' : 'bg-gradient-to-br from-pink-100 to-purple-100'
        }`}>
          <Gift className={`w-6 h-6 ${isPending ? 'text-blue-500' : 'text-pink-500'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 truncate">{reward.title}</h4>
          {reward.description && (
            <p className="text-sm text-gray-500 truncate">{reward.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-points">
              <Sparkles className="w-3 h-3" />
              {reward.points}
            </span>
            {isPending && (
              <span className="text-xs text-blue-500 font-medium">
                Aguardando aprovação
              </span>
            )}
          </div>
        </div>
      </div>
      
      {reward.image && (
        <img 
          src={reward.image} 
          alt={reward.title}
          className="mt-3 w-full h-32 object-cover rounded-xl"
        />
      )}
    </motion.div>
  );
}

// Create Reward Modal
function CreateRewardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser, suggestReward } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(50);
  const [image, setImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser?.coupleId) return;

    suggestReward({
      title: title.trim(),
      description: description.trim() || undefined,
      points,
      suggestedBy: currentUser.id,
      coupleId: currentUser.coupleId,
      image,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPoints(50);
    setImage(undefined);
    onClose();
  };

  const rewardSuggestions = [
    { title: 'Jantar romântico', points: 100 },
    { title: 'Massagem relaxante', points: 80 },
    { title: 'Filme da escolha', points: 50 },
    { title: 'Dia de spa em casa', points: 120 },
    { title: 'Café da manhã na cama', points: 60 },
  ];

  const selectSuggestion = (suggestion: typeof rewardSuggestions[0]) => {
    setTitle(suggestion.title);
    setPoints(suggestion.points);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-500" />
            Sugerir Recompensa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick suggestions */}
          <div>
            <Label className="text-gray-600">Sugestões rápidas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {rewardSuggestions.map((suggestion) => (
                <button
                  key={suggestion.title}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-sm hover:bg-pink-100 transition-colors"
                >
                  {suggestion.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="reward-title">Nome da recompensa</Label>
            <Input
              id="reward-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Jantar romântico"
              className="input-love mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="reward-description">Descrição (opcional)</Label>
            <Input
              id="reward-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da recompensa..."
              className="input-love mt-1"
            />
          </div>

          <div>
            <Label htmlFor="reward-points">Pontos necessários</Label>
            <div className="relative mt-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
              <Input
                id="reward-points"
                type="number"
                min={1}
                max={10000}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="input-love pl-10"
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Imagem (opcional)
            </Label>
            
            <div className="mt-2">
              {image ? (
                <div className="relative">
                  <img 
                    src={image} 
                    alt="Recompensa" 
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(undefined)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-pink-300 rounded-xl flex flex-col items-center justify-center text-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">Adicionar imagem</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-love gradient-love text-white"
            >
              <Gift className="w-4 h-4 mr-2" />
              Sugerir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
