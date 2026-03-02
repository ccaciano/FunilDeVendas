import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function DealsView() {
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const allDeals = useQuery(api.deals.list);
  const clients = useQuery(api.clients.list);

  // Filter deals by stage and search term
  const filteredDeals = allDeals?.filter(deal => {
    const matchesStage = selectedStage === "all" || deal.stage === selectedStage;
    const matchesSearch = searchTerm === "" || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.client?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStage && matchesSearch;
  });

  const stages = [
    { id: "all", label: "Todas", color: "bg-gray-100 text-gray-800" },
    { id: "lead", label: "Leads", color: "bg-gray-100 text-gray-800" },
    { id: "qualified", label: "Qualificados", color: "bg-blue-100 text-blue-800" },
    { id: "proposal", label: "Propostas", color: "bg-yellow-100 text-yellow-800" },
    { id: "negotiation", label: "Negociação", color: "bg-orange-100 text-orange-800" },
    { id: "closed_won", label: "Fechados", color: "bg-green-100 text-green-800" },
    { id: "closed_lost", label: "Perdidos", color: "bg-red-100 text-red-800" },
  ];

  if (!allDeals || !clients) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negociações</h1>
          <p className="text-gray-600">Gerencie suas oportunidades de venda</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nova Negociação
        </button>
      </div>

      {/* Search Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Pesquisar negociações por título, cliente ou empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stage Filter */}
      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setSelectedStage(stage.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedStage === stage.id
                ? stage.color
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          {filteredDeals?.length === 1 
            ? "1 negociação encontrada" 
            : `${filteredDeals?.length || 0} negociações encontradas`}
        </div>
      )}

      {/* Deals Grid */}
      <div className="grid gap-4">
        {filteredDeals?.map((deal) => (
          <DealCard key={deal._id} deal={deal} />
        ))}
        {filteredDeals?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm 
                ? "Nenhuma negociação encontrada para sua pesquisa" 
                : "Nenhuma negociação encontrada"}
            </p>
          </div>
        )}
      </div>

      {/* Create Deal Modal */}
      {showCreateForm && (
        <CreateDealModal
          clients={clients}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

function DealCard({ deal }: { deal: any }) {
  const [showDetails, setShowDetails] = useState(false);
  const updateStage = useMutation(api.deals.updateStage);
  const scheduleFollowUp = useMutation(api.deals.scheduleFollowUp);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStageColor = (stage: string) => {
    const colors = {
      lead: "bg-gray-100 text-gray-800",
      qualified: "bg-blue-100 text-blue-800",
      proposal: "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStageLabel = (stage: string) => {
    const labels = {
      lead: "Lead",
      qualified: "Qualificado",
      proposal: "Proposta",
      negotiation: "Negociação",
      closed_won: "Fechado - Ganho",
      closed_lost: "Fechado - Perdido",
    };
    return labels[stage as keyof typeof labels] || stage;
  };

  const handleStageChange = async (newStage: string, probability: number) => {
    try {
      await updateStage({
        id: deal._id,
        stage: newStage as any,
        probability,
      });
      toast.success("Estágio atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar estágio");
    }
  };

  const handleScheduleFollowUp = async () => {
    const date = prompt("Data do follow-up (YYYY-MM-DD):");
    if (!date) return;

    const notes = prompt("Notas (opcional):");
    
    try {
      await scheduleFollowUp({
        id: deal._id,
        followUpDate: new Date(date).getTime(),
        notes: notes || undefined,
      });
      toast.success("Follow-up agendado com sucesso!");
    } catch (error) {
      toast.error("Erro ao agendar follow-up");
    }
  };

  const isOverdue = deal.nextFollowUpDate && deal.nextFollowUpDate < Date.now();

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${
      isOverdue ? "border-red-500" : "border-blue-500"
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{deal.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
              {getStageLabel(deal.stage)}
            </span>
            {isOverdue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Atrasado
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Cliente:</span> {deal.client?.name}
            </div>
            <div>
              <span className="font-medium">Valor:</span> {formatCurrency(deal.value)}
            </div>
            <div>
              <span className="font-medium">Probabilidade:</span> {deal.probability}%
            </div>
            <div>
              <span className="font-medium">Previsão:</span> {new Date(deal.expectedCloseDate).toLocaleDateString()}
            </div>
          </div>

          {deal.nextFollowUpDate && (
            <div className="mt-2 text-sm">
              <span className="font-medium text-gray-600">Próximo follow-up:</span>{" "}
              <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                {new Date(deal.nextFollowUpDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={deal.stage}
              onChange={(e) => {
                const stage = e.target.value;
                const probability = stage === "lead" ? 10 : 
                                 stage === "qualified" ? 25 :
                                 stage === "proposal" ? 50 :
                                 stage === "negotiation" ? 75 :
                                 stage === "closed_won" ? 100 : 0;
                handleStageChange(stage, probability);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="lead">Lead</option>
              <option value="qualified">Qualificado</option>
              <option value="proposal">Proposta</option>
              <option value="negotiation">Negociação</option>
              <option value="closed_won">Fechado - Ganho</option>
              <option value="closed_lost">Fechado - Perdido</option>
            </select>
            
            <button
              onClick={handleScheduleFollowUp}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
            >
              Agendar Follow-up
            </button>
          </div>

          {deal.notes && (
            <div className="text-sm">
              <span className="font-medium text-gray-600">Notas:</span> {deal.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateDealModal({ clients, onClose }: { clients: any[], onClose: () => void }) {
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    value: "",
    expectedCloseDate: "",
    notes: "",
  });

  const createDeal = useMutation(api.deals.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.title || !formData.value || !formData.expectedCloseDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createDeal({
        clientId: formData.clientId as Id<"clients">,
        title: formData.title,
        value: parseFloat(formData.value),
        expectedCloseDate: new Date(formData.expectedCloseDate).getTime(),
        notes: formData.notes || undefined,
      });
      
      toast.success("Negociação criada com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao criar negociação");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Nova Negociação</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Prevista de Fechamento *
            </label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
