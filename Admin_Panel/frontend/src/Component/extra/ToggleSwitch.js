
import * as React from 'react';
import Switch from '@mui/material/Switch';

export default function ToggleSwitch(props) {
  const [checked, setChecked] = React.useState();

  const handleChange = (event) => {
    setChecked(event.target.checked);
  };
  return (
    <>
    <label className="switch me-2">
    <Switch
      checked={props.value}
      onChange={props.onChange}
      inputProps={{ 'aria-label': 'controlled' }}
      onClick={props.onClick}
      style={{cursor:"pointer"}}
      disabled={props.disabled}
    />
    </label>
    </>
  );
}