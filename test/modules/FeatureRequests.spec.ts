import * as FeatureRequests from '../../src/modules/FeatureRequests';
import { NativeFeatureRequests } from '../../src/native/NativeFeatureRequests';
import { ActionType } from '../../src/utils/Enums';

describe('Feature Requests Module', () => {
  it('should call the native method setEmailFieldRequiredForFeatureRequests', () => {
    const actionType = ActionType.reportBug;
    FeatureRequests.setEmailFieldRequired(true, actionType);

    expect(NativeFeatureRequests.setEmailFieldRequiredForFeatureRequests).toBeCalledTimes(1);
    expect(NativeFeatureRequests.setEmailFieldRequiredForFeatureRequests).toBeCalledWith(true, [
      actionType,
    ]);
  });

  it('should call the native method showFeatureRequests', () => {
    FeatureRequests.show();

    expect(NativeFeatureRequests.show).toBeCalledTimes(1);
  });

  it('should call the native method setEnabled with true', () => {
    FeatureRequests.setEnabled(true);

    expect(NativeFeatureRequests.setEnabled).toBeCalledTimes(1);
    expect(NativeFeatureRequests.setEnabled).toBeCalledWith(true);
  });
  it('should call the native method setEnabled with false', () => {
    FeatureRequests.setEnabled(false);

    expect(NativeFeatureRequests.setEnabled).toBeCalledTimes(1);
    expect(NativeFeatureRequests.setEnabled).toBeCalledWith(false);
  });
});
