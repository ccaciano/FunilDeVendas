import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function NotificationsView() {
  const notifications = useQuery(api.notifications.getUnread);
  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead({ id: id as any });
      toast.success("Notificação marcada como lida");
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
    }
  };

  if (!notifications) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-600">Acompanhe seus lembretes e follow-ups</p>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tudo em dia!</h3>
          <p className="text-gray-500">Você não tem notificações pendentes no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ notification, onMarkAsRead }: { 
  notification: any, 
  onMarkAsRead: (id: string) => void 
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "follow_up":
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "overdue":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "follow_up":
        return "bg-blue-50 border-blue-200";
      case "overdue":
        return "bg-red-50 border-red-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getTypeColor(notification.type)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {notification.message}
              </p>
              <div className="mt-1 text-sm text-gray-600">
                <p><span className="font-medium">Cliente:</span> {notification.client?.name}</p>
                <p><span className="font-medium">Negociação:</span> {notification.deal?.title}</p>
                <p><span className="font-medium">Agendado para:</span> {new Date(notification.scheduledFor).toLocaleString()}</p>
              </div>
            </div>
            
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Marcar como lida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
