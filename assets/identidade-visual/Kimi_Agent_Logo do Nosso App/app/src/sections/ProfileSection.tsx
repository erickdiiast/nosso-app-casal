import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Camera, 
  Heart, 
  LogOut,
  Edit2,
  Check,
  X,
  Sparkles,
  Trophy,
  Gift,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/hooks/useApp';
import { COLOR_OPTIONS } from '@/types';

export function ProfileSection() {
  const { 
    currentUser, 
    partner, 
    couple, 
    logout, 
    unlinkCouple,
    tasks,
    vouchers,
    rewards 
  } = useApp();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const completedTasks = tasks.filter(t => t.assignedTo === currentUser?.id && t.completed).length;
  const activeVouchers = vouchers.filter(v => v.redeemedBy === currentUser?.id && v.status === 'active').length;
  const suggestedRewards = rewards.filter(r => r.suggestedBy === currentUser?.id && r.status === 'approved').length;

  const stats = [
    { icon: CheckSquare, label: 'Tarefas concluídas', value: completedTasks, color: 'text-green-500' },
    { icon: Gift, label: 'Vales ativos', value: activeVouchers, color: 'text-purple-500' },
    { icon: Sparkles, label: 'Recompensas sugeridas', value: suggestedRewards, color: 'text-pink-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>
        <p className="text-gray-500">Suas informações e estatísticas 👤</p>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-love p-6 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-pink-400 to-purple-500" />
        
        <div className="relative pt-12">
          {/* Avatar */}
          <motion.div
            className="w-24 h-24 rounded-full border-4 border-white mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.hex }}
            whileHover={{ scale: 1.05 }}
          >
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              currentUser?.name.charAt(0).toUpperCase()
            )}
          </motion.div>

          <h3 className="text-xl font-bold text-gray-800">{currentUser?.name}</h3>
          <p className="text-gray-500 flex items-center justify-center gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {currentUser?.email}
          </p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.hex }}
            />
            <span className="text-sm text-gray-500">
              {COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.label}
            </span>
          </div>

          <Button
            onClick={() => setShowEditModal(true)}
            variant="outline"
            className="mt-4 rounded-full"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Editar perfil
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-love p-4 text-center"
          >
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Couple info */}
      {partner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-love p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <h3 className="text-lg font-bold text-gray-800">Seu casal</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div 
                className="w-14 h-14 rounded-full border-3 border-white flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.hex }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div 
                className="w-14 h-14 rounded-full border-3 border-white flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === partner?.color)?.hex }}
              >
                {partner.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {currentUser?.name} & {partner.name}
              </p>
              <p className="text-sm text-gray-500">
                Juntos desde {new Date(couple?.createdAt || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-700">Pontos do casal</span>
            </div>
            <span className="text-xl font-bold text-yellow-600">{couple?.totalPoints || 0}</span>
          </div>

          <Button
            onClick={() => setShowUnlinkModal(true)}
            variant="outline"
            className="w-full mt-4 text-red-500 border-red-200 hover:bg-red-50 rounded-full"
          >
            <Heart className="w-4 h-4 mr-2 fill-red-500" />
            Desvincular casal
          </Button>
        </motion.div>
      )}

      {/* Logout */}
      <Button
        onClick={logout}
        variant="outline"
        className="w-full text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />

      {/* Unlink Couple Modal */}
      <Dialog open={showUnlinkModal} onOpenChange={setShowUnlinkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Desvincular casal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-red-700 text-sm">
                <strong>Atenção!</strong> Esta ação não pode ser desfeita. 
                Todas as tarefas, recompensas e vales serão perdidos.
              </p>
            </div>

            <p className="text-gray-600">
              Tem certeza que deseja desvincular seu casal?
            </p>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUnlinkModal(false)}
                className="flex-1 rounded-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  unlinkCouple();
                  setShowUnlinkModal(false);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
              >
                <Heart className="w-4 h-4 mr-2 fill-white" />
                Desvincular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Profile Modal
function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useApp();
  const [name, setName] = useState(currentUser?.name || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.color || 'pink');
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the user profile
    // For now, we'll just close the modal
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Edit2 className="w-6 h-6 text-pink-500" />
            Editar Perfil
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="text-center">
            <Label className="block mb-2">Foto de perfil</Label>
            <div className="relative inline-block">
              <motion.div
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold mx-auto"
                style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === selectedColor)?.hex }}
                whileHover={{ scale: 1.05 }}
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </motion.div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-love mt-1"
              required
            />
          </div>

          {/* Color */}
          <div>
            <Label className="block mb-2">Cor do perfil</Label>
            <div className="flex gap-3 flex-wrap justify-center">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value as typeof selectedColor)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedColor === color.value 
                      ? 'ring-4 ring-offset-2 ring-pink-300 scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
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
              <Check className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
