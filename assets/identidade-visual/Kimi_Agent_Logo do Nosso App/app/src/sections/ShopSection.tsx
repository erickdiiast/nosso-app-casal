import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Gift, 
  Sparkles, 
  Check, 
  X, 
  Ticket,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/hooks/useApp';
import type { Reward } from '@/types';

export function ShopSection() {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const { 
    currentUser, 
    getApprovedRewards, 
    redeemReward,
    getActiveVouchers 
  } = useApp();

  const approvedRewards = getApprovedRewards();
  const activeVouchers = getActiveVouchers();
  const userPoints = currentUser?.points || 0;

  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmModal(true);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      redeemReward(selectedReward.id);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loja de Vales</h2>
          <p className="text-gray-500">Resgate recompensas com seus pontos 🛍️</p>
        </div>
        <motion.div
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full"
          whileHover={{ scale: 1.05 }}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-bold">{userPoints} pts</span>
        </motion.div>
      </div>

      {/* Active vouchers */}
      {activeVouchers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-green-500" />
            Seus vales ativos
            <span className="text-sm font-normal text-gray-500">({activeVouchers.length})</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeVouchers.map((voucher) => (
              <motion.div
                key={voucher.id}
                layout
                className="card-love p-4 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{voucher.title}</h4>
                    {voucher.description && (
                      <p className="text-sm text-gray-500">{voucher.description}</p>
                    )}
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      Resgatado em {new Date(voucher.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Available rewards */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-500" />
          Recompensas disponíveis
          <span className="text-sm font-normal text-gray-500">({approvedRewards.length})</span>
        </h3>
        
        {approvedRewards.length === 0 ? (
          <div className="card-love p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma recompensa disponível</p>
            <p className="text-sm text-gray-400 mt-1">
              Sugira recompensas na aba "Recompensas"!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvedRewards.map((reward) => (
              <ShopRewardCard
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onRedeem={() => handleRedeem(reward)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-pink-500" />
              Confirmar resgate
            </DialogTitle>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-xl">
                <h4 className="font-bold text-gray-800">{selectedReward.title}</h4>
                {selectedReward.description && (
                  <p className="text-sm text-gray-500 mt-1">{selectedReward.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Seus pontos</span>
                <span className="font-bold text-lg">{userPoints}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                <span className="text-gray-600">Custo</span>
                <span className="font-bold text-lg text-yellow-600">- {selectedReward.points}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <span className="text-gray-600">Saldo restante</span>
                <span className="font-bold text-lg text-green-600">{userPoints - selectedReward.points}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={confirmRedeem}
                  className="flex-1 btn-love gradient-love text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-teal-500 mx-auto mb-4 flex items-center justify-center"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Vale resgatado! 🎉
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600 mb-6">
            Você resgatou <strong>{selectedReward?.title}</strong> com sucesso!
            O vale está disponível na sua coleção.
          </p>

          <Button
            onClick={() => {
              setShowSuccessModal(false);
              setSelectedReward(null);
            }}
            className="w-full btn-love gradient-love text-white"
          >
            <Gift className="w-5 h-5 mr-2" />
            Ver meus vales
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Shop Reward Card
function ShopRewardCard({ 
  reward, 
  userPoints, 
  onRedeem 
}: { 
  reward: Reward; 
  userPoints: number;
  onRedeem: () => void;
}) {
  const canAfford = userPoints >= reward.points;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-love overflow-hidden ${!canAfford ? 'opacity-60' : ''}`}
    >
      {reward.image && (
        <div className="relative h-32 overflow-hidden">
          <img 
            src={reward.image} 
            alt={reward.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className="badge-points">
              <Sparkles className="w-3 h-3" />
              {reward.points}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-bold text-gray-800">{reward.title}</h4>
          {!reward.image && (
            <span className="badge-points">
              <Sparkles className="w-3 h-3" />
              {reward.points}
            </span>
          )}
        </div>
        
        {reward.description && (
          <p className="text-sm text-gray-500 mb-3">{reward.description}</p>
        )}

        {!canAfford && (
          <div className="flex items-center gap-2 text-red-500 text-sm mb-3">
            <AlertCircle className="w-4 h-4" />
            <span>Faltam {reward.points - userPoints} pontos</span>
          </div>
        )}

        <Button
          onClick={onRedeem}
          disabled={!canAfford}
          className={`w-full rounded-full ${
            canAfford 
              ? 'btn-love gradient-love text-white' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {canAfford ? 'Resgatar' : 'Pontos insuficientes'}
        </Button>
      </div>
    </motion.div>
  );
}
