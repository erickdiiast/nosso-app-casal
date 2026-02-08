import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  CheckSquare, 
  Repeat, 
  Camera, 
  X, 
  Check,
  Sparkles,
  Trash2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/hooks/useApp';
import { RECURRENCE_LABELS, COLOR_OPTIONS } from '@/types';
import type { Task, TaskRecurrence } from '@/types';

export function TasksSection() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { currentUser, partner, tasks, completeTask, deleteTask } = useApp();

  const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id && !t.completed);
  const partnerTasks = tasks.filter(t => t.assignedTo === partner?.id && !t.completed);
  const completedTasks = tasks.filter(t => t.completed).slice(0, 10);

  const handleComplete = (task: Task) => {
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

  const handleCompleteWithPhoto = (photo?: string) => {
    if (selectedTask) {
      completeTask(selectedTask.id, photo);
      setShowCompleteModal(false);
      setSelectedTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tarefas</h2>
          <p className="text-gray-500">Organizem suas tarefas juntos 💕</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-love gradient-love text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova tarefa
        </Button>
      </div>

      {/* My tasks */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.hex }}
          />
          Suas tarefas
          <span className="text-sm font-normal text-gray-500">({myTasks.length})</span>
        </h3>
        
        {myTasks.length === 0 ? (
          <div className="card-love p-8 text-center">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Você não tem tarefas pendentes! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onComplete={() => handleComplete(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Partner tasks */}
      {partner && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === partner?.color)?.hex }}
            />
            Tarefas de {partner.name}
            <span className="text-sm font-normal text-gray-500">({partnerTasks.length})</span>
          </h3>
          
          {partnerTasks.length === 0 ? (
            <div className="card-love p-8 text-center">
              <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{partner.name} não tem tarefas pendentes!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partnerTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isReadOnly
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Tarefas concluídas</h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-gray-50 rounded-xl flex items-center gap-3 opacity-60"
              >
                <Check className="w-5 h-5 text-green-500" />
                <span className="flex-1 line-through text-gray-500">{task.title}</span>
                <span className="badge-points opacity-50">
                  <Sparkles className="w-3 h-3" />
                  {task.points}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      {/* Complete Task Modal */}
      <CompleteTaskModal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onComplete={handleCompleteWithPhoto}
        task={selectedTask}
      />
    </div>
  );
}

// Task Card Component
function TaskCard({ 
  task, 
  onComplete, 
  onDelete,
  isReadOnly = false 
}: { 
  task: Task; 
  onComplete?: () => void;
  onDelete?: () => void;
  isReadOnly?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-love p-4 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
        <CheckSquare className="w-6 h-6 text-pink-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 truncate">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-500 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          {task.recurrence !== 'none' && (
            <span className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="badge-points">
          <Sparkles className="w-3 h-3" />
          {task.points}
        </span>
        
        {!isReadOnly && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={onComplete}
              className="rounded-full text-green-500 hover:bg-green-50"
            >
              <Check className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="rounded-full text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Create Task Modal
function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser, partner, createTask } = useApp();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [assignedTo, setAssignedTo] = useState(currentUser?.id || '');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [dueDate, setDueDate] = useState('');

  // Atualizar assignedTo quando o modal abrir/fechar
  useEffect(() => {
    if (open) {
      // Se tem parceiro, sugerir atribuir ao parceiro por padrão
      setAssignedTo(partner?.id || currentUser?.id || '');
    }
  }, [open, partner?.id, currentUser?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      points,
      assignedTo,
      createdBy: currentUser!.id,
      coupleId: currentUser!.coupleId!,
      recurrence,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPoints(10);
    setRecurrence('none');
    setDueDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-pink-500" />
            Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título da tarefa</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lavar a louça"
              className="input-love mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              className="input-love mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="points">Pontos</Label>
              <div className="relative mt-1">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                <Input
                  id="points"
                  type="number"
                  min={1}
                  max={1000}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="input-love pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="assignedTo">Atribuir a</Label>
              <select
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full mt-1 input-love"
              >
                <option value={currentUser?.id}>Você</option>
                {partner && <option value={partner.id}>{partner.name}</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recurrence">Recorrência</Label>
              <select
                id="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                className="w-full mt-1 input-love"
              >
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="dueDate">Data limite (opcional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-love mt-1"
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
              <Check className="w-4 h-4 mr-2" />
              Criar tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Complete Task Modal
function CompleteTaskModal({ 
  open, 
  onClose, 
  onComplete,
  task 
}: { 
  open: boolean; 
  onClose: () => void;
  onComplete: (photo?: string) => void;
  task: Task | null;
}) {
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    onComplete(photo);
    setPhoto(undefined);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Check className="w-6 h-6 text-green-500" />
            Completar Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-pink-50 rounded-xl">
            <p className="font-bold text-gray-800">{task.title}</p>
            <p className="text-sm text-gray-500">Você ganhará {task.points} pontos! 🎉</p>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Foto de comprovação (opcional)
            </Label>
            
            <div className="mt-2">
              {photo ? (
                <div className="relative">
                  <img 
                    src={photo} 
                    alt="Comprovação" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setPhoto(undefined)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-pink-300 rounded-xl flex flex-col items-center justify-center text-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">Clique para adicionar foto</span>
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
              onClick={handleComplete}
              className="flex-1 btn-love bg-gradient-to-r from-green-500 to-teal-500 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Completar!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
