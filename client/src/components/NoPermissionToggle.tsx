import { usePermissionGroup, PermissionKey } from '@/hooks/usePermissionsStore';

interface NoPermissionToggleProps {
  groupKey: PermissionKey;
  label?: string;
  'data-testid'?: string;
  disabled?: boolean;
  className?: string;
}

export function NoPermissionToggle({ 
  groupKey, 
  label = "No Permission",
  'data-testid': testId,
  disabled = false,
  className = ""
}: NoPermissionToggleProps) {
  const { state, toggleNoPermission } = usePermissionGroup(groupKey);

  const handleChange = (checked: boolean) => {
    toggleNoPermission(checked);
  };

  const isDisabled = disabled;
  const isChecked = state.noPermission;

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={`${groupKey}NoPermission`}
        data-testid={testId || `checkbox-${groupKey}-no-permission`}
        checked={isChecked}
        disabled={isDisabled}
        onChange={(e) => handleChange(e.target.checked)}
        className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      <label 
        htmlFor={`${groupKey}NoPermission`} 
        className={`ml-2 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}
      >
        {label}
      </label>
    </div>
  );
}

interface PermissionToggleProps {
  groupKey: PermissionKey;
  permissionType: 'read' | 'fullControl' | 'export';
  label: string;
  'data-testid'?: string;
  disabled?: boolean;
  className?: string;
}

export function PermissionToggle({ 
  groupKey, 
  permissionType,
  label,
  'data-testid': testId,
  disabled = false,
  className = ""
}: PermissionToggleProps) {
  const { state, toggleRead, toggleFullControl, toggleExport } = usePermissionGroup(groupKey);

  const handleChange = (checked: boolean) => {
    switch (permissionType) {
      case 'read':
        toggleRead(checked);
        break;
      case 'fullControl':
        toggleFullControl(checked);
        break;
      case 'export':
        toggleExport(checked);
        break;
    }
  };

  const isDisabled = disabled || state.noPermission; // Auto-disable if No Permission is checked
  const isChecked = state[permissionType];

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={`${groupKey}${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`}
        data-testid={testId || `checkbox-${groupKey}-${permissionType}`}
        checked={isChecked}
        disabled={isDisabled}
        onChange={(e) => handleChange(e.target.checked)}
        className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      <label 
        htmlFor={`${groupKey}${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`}
        className={`ml-2 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}
      >
        {label}
      </label>
    </div>
  );
}

// Convenience component for a complete permission group
interface PermissionGroupProps {
  groupKey: PermissionKey;
  title: string;
  showExport?: boolean;
  className?: string;
}

export function PermissionGroup({ 
  groupKey, 
  title, 
  showExport = true,
  className = ""
}: PermissionGroupProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="space-y-2">
        <NoPermissionToggle 
          groupKey={groupKey}
          data-testid={`checkbox-${groupKey}-no-permission`}
        />
        <PermissionToggle 
          groupKey={groupKey}
          permissionType="read"
          label="Read"
          data-testid={`checkbox-${groupKey}-read`}
        />
        <PermissionToggle 
          groupKey={groupKey}
          permissionType="fullControl"
          label="Full Control"
          data-testid={`checkbox-${groupKey}-full-control`}
        />
        {showExport && (
          <PermissionToggle 
            groupKey={groupKey}
            permissionType="export"
            label="Export"
            data-testid={`checkbox-${groupKey}-export`}
          />
        )}
      </div>
    </div>
  );
}