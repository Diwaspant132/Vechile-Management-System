import React from 'react';
import RequestForm from '../../components/RequestForm';
import { useTranslation } from 'react-i18next';

const VehicleRequest = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="page-title">{t('request_a_vehicle')}</h2>
      <RequestForm />
    </div>
  );
};

export default VehicleRequest;
