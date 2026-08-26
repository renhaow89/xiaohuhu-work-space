// Finance Module
// Personal expense tracking

const FinanceModule = {
  create(amount, description) {
    return {
      type: 'finance',
      amount,
      description,
      createdAt: new Date().toISOString()
    };
  }
};

export default FinanceModule;
